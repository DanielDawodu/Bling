import express from 'express';
import bcrypt from 'bcrypt';
import passport from '../config/passport.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth-middleware.js';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create new user
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            emailVerificationToken,
            emailVerificationExpires,
            isEmailVerified: false
        });

        await newUser.save();

        // Send verification email
        await sendVerificationEmail(newUser.email, emailVerificationToken);

        res.status(201).json({
            message: 'Signup successful. Please check your email to verify your account.'
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Server error during login' });
        }

        if (!user) {
            return res.status(401).json({ error: info.message || 'Invalid credentials' });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({ error: 'Please verify your email to log in' });
        }

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            coverPhoto: user.coverPhoto,
            bio: user.bio,
            socialLinks: user.socialLinks,
            followers: user.followers,
            following: user.following,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
            isSuspended: user.isSuspended,
            isEmailVerified: user.isEmailVerified,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
            createdAt: user.createdAt
        };

        if (user.isTwoFactorEnabled) {
            return res.json({
                requireTwoFactor: true,
                userId: user._id,
                message: 'Two-factor authentication required'
            });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error logging in' });
            }
            res.json({ message: 'Login successful', user: userResponse });
        });
    })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
    const userResponse = {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        coverPhoto: req.user.coverPhoto,
        bio: req.user.bio,
        dateOfBirth: req.user.dateOfBirth,
        socialLinks: req.user.socialLinks,
        followers: req.user.followers,
        following: req.user.following,
        isAdmin: req.user.isAdmin,
        isVerified: req.user.isVerified,
        isSuspended: req.user.isSuspended,
        isEmailVerified: req.user.isEmailVerified,
        isTwoFactorEnabled: req.user.isTwoFactorEnabled,
        createdAt: req.user.createdAt
    };

    res.json({ user: userResponse });
});

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login` }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
);

// Verify Email route
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// Resend Verification Link
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();

        await sendVerificationEmail(user.email, emailVerificationToken);

        res.json({ message: 'Verification link resent. Please check your email.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Server error while resending link' });
    }
});

// 2FA Setup - Generate Secret
router.get('/2fa/setup', isAuthenticated, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Bling (${req.user.email})`
        });

        // Store secret temporarily (or just return it and verify later)
        // We'll store it permanently only after verification
        req.session.tempTwoFactorSecret = secret.base32;

        // Generate QR Code as SVG
        const qrSvg = await qrcode.toString(secret.otpauth_url, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 4,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        // Read logo and convert to base64
        const logoPath = path.join(__dirname, '../../../frontend/public/logo.png');
        let logoBase64 = '';
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        } catch (e) {
            console.error('Logo not found for 2FA QR:', logoPath);
        }

        // Custom SVG injection for the logo
        // We'll add a white background circle/square and then the logo in the center
        // Note: The SVG from 'qrcode' has a viewBox="0 0 size size"
        // We can find the size from the viewBox
        const viewBoxMatch = qrSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
        let finalQrCode = '';
        if (viewBoxMatch && logoBase64) {
            const size = parseInt(viewBoxMatch[1]);
            const logoSize = Math.floor(size * 0.22); // ~22% of QR size
            const center = size / 2;
            const pos = center - (logoSize / 2);

            const logoSvg = `
                <rect x="${pos - 1}" y="${pos - 1}" width="${logoSize + 2}" height="${logoSize + 2}" fill="white" rx="2" />
                <image x="${pos}" y="${pos}" width="${logoSize}" height="${logoSize}" href="${logoBase64}" />
            </svg>`;

            finalQrCode = qrSvg.replace('</svg>', logoSvg);
            // Convert modified SVG to data URL for easy consumption by <img>
            finalQrCode = `data:image/svg+xml;base64,${Buffer.from(finalQrCode).toString('base64')}`;
        } else {
            // Fallback to standard PNG if SVG manipulation fails or logo is missing
            finalQrCode = await qrcode.toDataURL(secret.otpauth_url, { errorCorrectionLevel: 'H' });
        }

        res.json({ secret: secret.base32, qrCode: finalQrCode });
    } catch (error) {
        console.error('2FA Setup error:', error);
        res.status(500).json({ error: 'Error generating 2FA secret' });
    }
});

// 2FA Verify and Enable
router.post('/2fa/verify', isAuthenticated, async (req, res) => {
    try {
        const { token } = req.body;
        const secret = req.session.tempTwoFactorSecret;

        if (!secret) {
            return res.status(400).json({ error: 'Setup session expired. Please restart 2FA setup.' });
        }

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // Higher tolerance for time drift (+/- 30s)
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        const user = await User.findById(req.user._id);
        user.twoFactorSecret = encrypt(secret); // ENCRYPT the secret before saving
        user.isTwoFactorEnabled = true;
        await user.save();

        req.session.tempTwoFactorSecret = undefined;
        res.json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
        console.error('2FA Verify error:', error);
        res.status(500).json({ error: 'Error verifying 2FA token' });
    }
});

// 2FA Login Verification
router.post('/2fa/login-verify', async (req, res) => {
    try {
        let { userId, token } = req.body;
        // Strip any spaces or dashes and ensure it is a string
        if (token) token = token.toString().replace(/[\s-]/g, '');

        const user = await User.findById(userId);
        console.log(`[2FA DEBUG] Server Time: ${new Date().toISOString()}`);

        if (!user || !user.isTwoFactorEnabled) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const decryptedSecret = decrypt(user.twoFactorSecret);

        const verified = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: 'base32',
            token: token,
            window: 2 // Tolerance for time drift (+/- 60s)
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error logging in' });
            }

            const userResponse = {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                isTwoFactorEnabled: user.isTwoFactorEnabled
            };

            res.json({ message: 'Login successful', user: userResponse });
        });
    } catch (error) {
        console.error('2FA Login Verify error:', error);
        res.status(500).json({ error: 'Error during 2FA verification' });
    }
});

// 2FA Disable
router.post('/2fa/disable', isAuthenticated, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id);

        const verified = speakeasy.totp.verify({
            secret: decrypt(user.twoFactorSecret), // DECRYPT before verifying
            encoding: 'base32',
            token: token,
            window: 1 // Higher tolerance for time drift (+/- 30s)
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        user.twoFactorSecret = null;
        user.isTwoFactorEnabled = false;
        await user.save();

        res.json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
        console.error('2FA Disable error:', error);
        res.status(500).json({ error: 'Error disabling 2FA' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Secretive response for security
            return res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error during password reset request' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

export default router;
