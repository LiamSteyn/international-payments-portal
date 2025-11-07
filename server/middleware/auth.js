import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  console.log('\n🔐 [JWT] Token verification started');
  console.log(`   Route: ${req.method} ${req.path}`);
  console.log(`   IP: ${req.ip}`);
  
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    console.log('   STEP 1: Authorization Header Check');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('   ❌ No token provided or invalid format');
      console.log('   Expected: Bearer <token>');
      console.log('   Received: ' + (authHeader ? authHeader.substring(0, 20) + '...' : 'none'));
      console.log('');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    console.log('   ✓ Authorization header found');

    const token = authHeader.substring(7);
    console.log(`   ✓ Token extracted: ${token.substring(0, 20)}...`);

    console.log('\n   STEP 2: JWT Token Verification');
    console.log('   - Verifying signature...');
    console.log('   - Checking expiration...');
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'test'
    );
    
    console.log('   ✓ Token signature valid');
    console.log('   ✓ Token not expired');
    console.log(`   ✓ Decoded payload: { email: ${decoded.email}, userType: ${decoded.userType} }`);

    console.log('\n   STEP 3: Attaching User to Request');
    req.user = {
      email: decoded.email,
      userType: decoded.userType
    };
    console.log('   ✓ User authenticated successfully');
    console.log(`   ✓ Proceeding to route handler...\n`);

    next();

  } catch (error) {
    console.log('\n   ❌ JWT VERIFICATION FAILED');
    
    if (error.name === 'TokenExpiredError') {
      console.log('   Reason: Token has expired');
      console.log(`   Expired at: ${error.expiredAt}`);
      console.log('');
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      console.log('   Reason: Invalid token signature or format');
      console.log(`   Error: ${error.message}`);
      console.log('');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.log(`   Reason: ${error.message}`);
    console.log('');
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

export const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    console.log('\n👤 [AUTHORIZATION] User type verification');
    console.log(`   Required types: ${allowedTypes.join(', ')}`);
    console.log(`   User type: ${req.user?.userType || 'none'}`);
    
    if (!req.user) {
      console.log('   ❌ No authenticated user\n');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      console.log('   ❌ Insufficient permissions');
      console.log(`   User ${req.user.email} does not have required access\n`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    console.log('   ✓ User type authorized');
    console.log('   ✓ Proceeding...\n');
    next();
  };
};