import express from 'express';
import validator from 'validator';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const transactions = new Map();

const sanitizeInput = (input) => {
  const sanitized = validator.escape(input.trim());
  console.log(`   🧹 Sanitized: "${input}" → "${sanitized}"`);
  return sanitized;
};

const validateSwiftCode = (code) => {
  const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const isValid = swiftRegex.test(code);
  console.log(`   🏦 SWIFT Code Validation (RegEx):`);
  console.log(`      - Pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/`);
  console.log(`      - Input: ${code}`);
  console.log(`      - Result: ${isValid ? '✓ VALID' : '✗ INVALID'}`);
  return isValid;
};

// Process Payment Route
router.post('/process', verifyToken, async (req, res) => {
  console.log('\n💳 [PAYMENT] Payment processing initiated');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   User: ${req.user.email} (${req.user.userType})`);
  console.log(`   IP: ${req.ip}`);
  
  try {
    let { amount, recipientName, recipientAccount, swiftCode } = req.body;

    console.log('\n   STEP 1: JWT Token Verification');
    console.log('   ✓ Token verified by middleware');
    console.log(`   ✓ Authenticated user: ${req.user.email}`);

    console.log('\n   STEP 2: Input Sanitization (XSS Protection)');
    recipientName = sanitizeInput(recipientName);
    recipientAccount = sanitizeInput(recipientAccount);
    swiftCode = sanitizeInput(swiftCode.toUpperCase());

    console.log('\n   STEP 3: Amount Validation');
    const parsedAmount = parseFloat(amount);
    console.log(`      - Input: ${amount}`);
    console.log(`      - Parsed: ${parsedAmount}`);
    console.log(`      - Valid: ${!isNaN(parsedAmount) && parsedAmount > 0 ? '✓' : '✗'}`);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('   ❌ Payment FAILED: Invalid amount\n');
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    console.log('\n   STEP 4: Recipient Name Validation');
    console.log(`      - Length: ${recipientName.length} chars`);
    console.log(`      - Valid: ${recipientName.length >= 2 ? '✓' : '✗'}`);
    
    if (!recipientName || recipientName.length < 2) {
      console.log('   ❌ Payment FAILED: Invalid recipient name\n');
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient name'
      });
    }

    console.log('\n   STEP 5: Account Number Validation');
    console.log(`      - Length: ${recipientAccount.length} chars`);
    console.log(`      - Valid: ${recipientAccount.length >= 5 ? '✓' : '✗'}`);
    
    if (!recipientAccount || recipientAccount.length < 5) {
      console.log('   ❌ Payment FAILED: Invalid account number\n');
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient account number'
      });
    }

    console.log('\n   STEP 6: SWIFT Code Validation (RegEx)');
    if (!validateSwiftCode(swiftCode)) {
      console.log('   ❌ Payment FAILED: Invalid SWIFT code\n');
      return res.status(400).json({
        success: false,
        message: 'Invalid SWIFT/BIC code format'
      });
    }

    console.log('\n   STEP 7: Transaction ID Generation');
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log(`   ✓ Generated: ${transactionId}`);

    console.log('\n   STEP 8: Transaction Storage');
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
    console.log('   ✓ Transaction saved to database');

    console.log('\n   ✅ PAYMENT SUCCESSFUL');
    console.log(`      - Transaction ID: ${transactionId}`);
    console.log(`      - Amount: $${parsedAmount}`);
    console.log(`      - Recipient: ${recipientName}`);
    console.log(`      - Account: ${recipientAccount}`);
    console.log(`      - SWIFT: ${swiftCode}`);
    console.log('');

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
    console.error('\n❌ [PAYMENT ERROR]', error);
    console.error('');
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
});

// Get Transaction History
router.get('/history', verifyToken, async (req, res) => {
  console.log('\n📋 [HISTORY] Transaction history request');
  console.log(`   User: ${req.user.email} (${req.user.userType})`);
  
  try {
    console.log('   ✓ JWT token verified');
    console.log('   ✓ Filtering transactions by user...');
    
    const userTransactions = Array.from(transactions.values())
      .filter(txn => txn.initiatedBy === req.user.email)
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`   ✓ Found ${userTransactions.length} transaction(s)`);
    console.log('');

    res.json({
      success: true,
      transactions: userTransactions
    });

  } catch (error) {
    console.error('\n❌ [HISTORY ERROR]', error);
    console.error('');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history'
    });
  }
});

// Get Single Transaction
router.get('/:transactionId', verifyToken, async (req, res) => {
  console.log('\n🔍 [TRANSACTION] Single transaction lookup');
  console.log(`   Transaction ID: ${req.params.transactionId}`);
  console.log(`   User: ${req.user.email}`);
  
  try {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      console.log('   ❌ Transaction not found\n');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    console.log('   ✓ Transaction found');

    console.log('\n   STEP: Authorization Check');
    console.log(`      - Transaction owner: ${transaction.initiatedBy}`);
    console.log(`      - Requesting user: ${req.user.email}`);
    
    if (transaction.initiatedBy !== req.user.email) {
      console.log('   ❌ Unauthorized access attempt\n');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    console.log('   ✓ Authorization verified');
    console.log('');

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('\n❌ [TRANSACTION ERROR]', error);
    console.error('');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction'
    });
  }
});

export default router;