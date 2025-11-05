import express from 'express';
import validator from 'validator';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// In-memory transaction store (replace with database in production)
const transactions = new Map();

const sanitizeInput = (input) => {
  return validator.escape(input.trim());
};

const validateSwiftCode = (code) => {
  // SWIFT/BIC format: 6 letters, 2 letters/digits, optional 3 letters/digits
  const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return swiftRegex.test(code);
};

// Process Payment Route (Protected)
router.post('/process', verifyToken, async (req, res) => {
  try {
    let { amount, recipientName, recipientAccount, swiftCode } = req.body;

    // Sanitize inputs
    recipientName = sanitizeInput(recipientName);
    recipientAccount = sanitizeInput(recipientAccount);
    swiftCode = sanitizeInput(swiftCode.toUpperCase());

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Validate recipient name
    if (!recipientName || recipientName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient name'
      });
    }

    // Validate recipient account
    if (!recipientAccount || recipientAccount.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient account number'
      });
    }

    // Validate SWIFT code
    if (!validateSwiftCode(swiftCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SWIFT/BIC code format'
      });
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Store transaction
    const transaction = {
      transactionId,
      amount: parsedAmount,
      recipientName,
      recipientAccount,
      swiftCode,
      initiatedBy: req.user.email,
      userType: req.user.userType,
      status: 'completed',
      timestamp: new Date()
    };

    transactions.set(transactionId, transaction);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      transactionId,
      transaction: {
        transactionId,
        amount: parsedAmount,
        recipientName,
        status: 'completed',
        timestamp: transaction.timestamp
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
});

// Get Transaction History (Protected)
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userTransactions = Array.from(transactions.values())
      .filter(txn => txn.initiatedBy === req.user.email)
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      transactions: userTransactions
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history'
    });
  }
});

// Get Single Transaction (Protected)
router.get('/:transactionId', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user owns this transaction
    if (transaction.initiatedBy !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Transaction retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction'
    });
  }
});

export default router;