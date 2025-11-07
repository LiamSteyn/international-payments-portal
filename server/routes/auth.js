import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';

const users = new Map();

let accountsSeeded = false;

// Pre-seed employee account
(async () => {
   if (accountsSeeded) return;
   accountsSeeded = true;
  const hashedPass = await bcrypt.hash('Employee123!', 10);
  users.set('employee@company.com', {
    email: 'employee@company.com',
    password: hashedPass,
    userType: 'employee',
    createdAt: new Date()
  });

  const customerHashedPass = await bcrypt.hash('CustomerPass1!', 10);
  users.set('customer@example.com', {
    email: 'customer@example.com',
    password: customerHashedPass,
    userType: 'customer',
    createdAt: new Date()
  });

  console.log('\n🔐 [AUTH] Pre-seeded accounts created with hashed passwords');
  console.log('   Employee: employee@company.com');
  console.log('   Customer: customer@example.com');
})();

const router = express.Router();

// Validation Functions with Logging
const validateEmail = (email) => {
  const isValid = validator.isEmail(email);
  console.log(`   📧 Email Validation: ${email} - ${isValid ? '✓ VALID' : '✗ INVALID'}`);
  return isValid;
};

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  console.log(`   🔒 Password Validation:`);
  console.log(`      - Length (8+): ${minLength ? '✓' : '✗'}`);
  console.log(`      - Uppercase: ${hasUpper ? '✓' : '✗'}`);
  console.log(`      - Lowercase: ${hasLower ? '✓' : '✗'}`);
  console.log(`      - Number: ${hasNumber ? '✓' : '✗'}`);
  console.log(`      - Special char: ${hasSpecial ? '✓' : '✗'}`);
  
  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  console.log(`      - Overall: ${isValid ? '✓ VALID' : '✗ INVALID'}`);
  return isValid;
};

const sanitizeInput = (input) => {
  const sanitized = validator.escape(input.trim());
  console.log(`   🧹 Input Sanitized: "${input}" → "${sanitized}"`);
  return sanitized;
};

// Register Route
router.post('/register', async (req, res) => {
  console.log('\n📝 [REGISTER] Registration attempt');
  console.log('   Status: DISABLED (Security measure - pre-seeded accounts only)');
  
  return res.status(403).json({
    success: false,
    message: 'Registration feature is currently unavailable. Coming Soon!'
  });
});

// Login Route with Enhanced Logging
router.post('/login', async (req, res) => {
  console.log('\n🔓 [LOGIN] Login attempt initiated');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   IP: ${req.ip}`);
  
  try {
    let { email, password, userType } = req.body;

    console.log('\n   STEP 1: Input Sanitization');
    email = sanitizeInput(email);
    userType = sanitizeInput(userType);

    console.log('\n   STEP 2: Email Validation (RegEx)');
    if (!validateEmail(email)) {
      console.log('   ❌ Login FAILED: Invalid email format\n');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    console.log('\n   STEP 3: User Lookup');
    const user = users.get(email);

    if (!user) {
      console.log('   ❌ Login FAILED: User not found\n');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    console.log('   ✓ User found in database');

    console.log('\n   STEP 4: User Type Verification');
    console.log(`      - Requested: ${userType}`);
    console.log(`      - Actual: ${user.userType}`);
    
    if (user.userType !== userType) {
      console.log(`   ❌ Login FAILED: User type mismatch\n`);
      return res.status(401).json({
        success: false,
        message: `This account is registered for ${user.userType} portal`
      });
    }
    console.log('   ✓ User type verified');

    console.log('\n   STEP 5: Password Verification (bcrypt)');
    console.log('      - Comparing hashed password...');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('   ❌ Login FAILED: Invalid password\n');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    console.log('   ✓ Password verified successfully');

    console.log('\n   STEP 6: JWT Token Generation');
    const token = jwt.sign(
      { 
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET || 'test',
      { expiresIn: '1h' }
    );
    console.log('   ✓ JWT token generated (1h expiration)');
    console.log(`   ✓ Token payload: { email: ${user.email}, userType: ${user.userType} }`);

    console.log('\n   ✅ LOGIN SUCCESSFUL');
    console.log(`      - User: ${user.email}`);
    console.log(`      - Type: ${user.userType}`);
    console.log(`      - Token: ${token.substring(0, 20)}...`);
    console.log('');

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
    console.error('\n❌ [LOGIN ERROR]', error);
    console.error('');
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

export default router;