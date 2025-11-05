import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';

const router = express.Router();

// In-memory user store (replace with database in production)
const users = new Map();

// Validation Functions
const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

const sanitizeInput = (input) => {
  return validator.escape(input.trim());
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    let { email, password, userType } = req.body;

    // Sanitize inputs
    email = sanitizeInput(email);
    userType = sanitizeInput(userType);

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      });
    }

    // Check if user exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Validate user type
    if (!['customer', 'employee'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user
    users.set(email, {
      email,
      password: hashedPassword,
      userType,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    let { email, password, userType } = req.body;

    // Sanitize inputs
    email = sanitizeInput(email);
    userType = sanitizeInput(userType);

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get user
    const user = users.get(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check user type
    if (user.userType !== userType) {
      return res.status(401).json({
        success: false,
        message: `This account is registered for ${user.userType} portal`
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

export default router;