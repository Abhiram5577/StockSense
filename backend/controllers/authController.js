import bcrypt from 'bcryptjs';
import UserModel from '../models/userModel.js';
import OtpModel from '../models/otpModel.js';
import { generateToken, generateResetToken, verifyToken } from '../utils/jwt.js';
import { generateSixDigitOtp, hashOtp, compareOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../services/emailService.js';
import {
  normalizeEmail,
  isValidEmail,
  validatePassword,
  isValidOtpFormat,
} from '../utils/validation.js';

export const AuthController = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // 1. Validation
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required (minimum 2 characters)',
        });
      }

      const cleanEmail = normalizeEmail(email);
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message,
        });
      }

      // 2. Check for duplicate email
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // 3. Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Save to MySQL
      await UserModel.create({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role || 'staff',
      });

      // 5. Clean success response (never expose password_hash)
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
      });
    } catch (error) {
      console.error('[Register Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating account',
      });
    }
  },

  /**
   * Log in an existing user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const cleanEmail = normalizeEmail(email);

      // 1. Find user by email
      const user = await UserModel.findByEmail(cleanEmail);
      if (!user) {
        // Generic message to prevent user enumeration
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // 2. Compare password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // 3. Generate JWT (payload contains only essential non-sensitive data)
      const token = generateToken({
        userId: user.id,
        role: user.role,
      });

      // 4. Return token and safe user profile
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[Login Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
      });
    }
  },

  /**
   * Get authenticated user profile
   * GET /api/auth/me
   */
  async getMe(req, res) {
    try {
      const userId = req.user.userId;

      // Query database for up-to-date user details
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found',
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('[GetMe Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error retrieving user profile',
      });
    }
  },

  /**
   * Request password reset OTP
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required',
        });
      }

      const cleanEmail = normalizeEmail(email);
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const user = await UserModel.findByEmail(cleanEmail);

      // If user exists, create and dispatch OTP
      if (user) {
        // 1. Invalidate any previously active OTPs for this user
        await OtpModel.invalidateUserOtps(user.id);

        // 2. Generate cryptographically secure 6-digit OTP
        const plainOtp = generateSixDigitOtp();

        // 3. Hash the OTP using bcrypt before storing
        const hashedOtp = await hashOtp(plainOtp);

        // 4. Set expiry to 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 5. Store record in MySQL
        await OtpModel.create({
          userId: user.id,
          otpHash: hashedOtp,
          expiresAt,
        });

        // 6. Send OTP via Gmail SMTP
        // Handled asynchronously so transient email errors don't leak account existence
        sendOtpEmail(user.email, user.name, plainOtp).catch((err) => {
          console.error('[Email Dispatch Error]', err.message);
        });
      }

      // 7. Generic response prevents user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.',
      });
    } catch (error) {
      console.error('[ForgotPassword Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error processing password reset request',
      });
    }
  },

  /**
   * Verify password reset OTP
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and 6-digit OTP are required',
        });
      }

      const cleanEmail = normalizeEmail(email);
      const cleanOtp = String(otp).trim();

      if (!isValidOtpFormat(cleanOtp)) {
        return res.status(400).json({
          success: false,
          message: 'OTP must be exactly 6 digits',
        });
      }

      const user = await UserModel.findByEmail(cleanEmail);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
      }

      // Retrieve latest active OTP for user
      const latestOtp = await OtpModel.getLatestActiveOtp(user.id);
      if (!latestOtp) {
        return res.status(400).json({
          success: false,
          message: 'No active OTP request found. Please request a new OTP.',
        });
      }

      // Check maximum attempts (limit = 5)
      if (latestOtp.attempts >= 5) {
        await OtpModel.markAsUsed(latestOtp.id);
        return res.status(429).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
        });
      }

      // Check expiration (10 minutes)
      const now = new Date();
      const expiresAt = new Date(latestOtp.expires_at);
      if (now > expiresAt) {
        await OtpModel.markAsUsed(latestOtp.id);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.',
        });
      }

      // Verify OTP hash with bcrypt
      const isMatch = await compareOtp(cleanOtp, latestOtp.otp_hash);
      if (!isMatch) {
        await OtpModel.incrementAttempts(latestOtp.id);
        const remainingAttempts = 5 - (latestOtp.attempts + 1);
        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Maximum attempts reached.'}`,
        });
      }

      // Mark OTP as used to prevent replay
      await OtpModel.markAsUsed(latestOtp.id);

      // Generate single-use, short-lived reset authorization token
      const resetToken = generateResetToken({
        userId: user.id,
        email: user.email,
      });

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        resetToken,
      });
    } catch (error) {
      console.error('[VerifyOtp Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error verifying OTP',
      });
    }
  },

  /**
   * Reset user password using reset authorization token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Reset authorization token is required',
        });
      }

      // 1. Verify reset token
      let decoded;
      try {
        decoded = verifyToken(resetToken);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset session. Please request a new OTP.',
        });
      }

      if (decoded.purpose !== 'password_reset' || !decoded.userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authorization token purpose',
        });
      }

      // 2. Validate new password
      const passwordCheck = validatePassword(newPassword);
      if (!passwordCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message,
        });
      }

      // 3. Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 4. Update password in MySQL
      const updated = await UserModel.updatePassword(decoded.userId, newPasswordHash);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User account not found',
        });
      }

      // 5. Invalidate all OTPs for this user
      await OtpModel.invalidateUserOtps(decoded.userId);

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      console.error('[ResetPassword Error]', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error resetting password',
      });
    }
  },

  /**
   * Logout user (stateless JWT acknowledgment)
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // In stateless JWT authentication, the client removes the stored token from localStorage.
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  },
};

export default AuthController;
