import { verifyToken } from '../utils/jwt.js';

/**
 * Express middleware to authenticate requests using JWT Bearer tokens
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization header provided.',
    });
  }

  // Expect: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format must be: Bearer <token>',
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);

    // Prevent using short-lived password reset tokens as login tokens
    if (decoded.purpose === 'password_reset') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Password reset tokens cannot access API endpoints.',
      });
    }

    // Attach decoded user information to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
}

export default authenticateToken;
