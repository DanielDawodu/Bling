import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendVerificationEmail = async (to, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@bling-app.com',
        to,
        subject: 'Welcome to Bling - Verify Your Email',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <div style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                <h1 style="margin: 0; color: #fbbf24; font-size: 32px; letter-spacing: 1px;">Bling</h1>
                <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 16px;">The Developer Social Network</p>
            </div>
            <div style="padding: 40px 30px; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #f8fafc;">Verify your email address</h2>
                <p>Hi there,</p>
                <p>Welcome to <strong>Bling</strong>! We're excited to have you join our community of developers. To get started, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${verificationUrl}" style="background-color: #fbbf24; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s ease;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #fbbf24; font-size: 13px;">${verificationUrl}</p>
                
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #64748b; text-align: center;">
                    This link will expire in 24 hours. If you didn't create an account with Bling, you can safely ignore this email.
                </p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #1e293b; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Bling App. All rights reserved.
            </div>
        </div>
    `
    };

    try {
        // If credentials are not set, just log the URL for dev purposes
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('====================================================');
            console.log('EMAIL NOT CONFIGURED. MOCKING EMAIL SENDING.');
            console.log(`To: ${to}`);
            console.log(`Subject: Verify your email for Bling`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log('====================================================');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (to, token) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@bling-app.com',
        to,
        subject: 'Bling - Reset Your Password',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
            <div style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                <h1 style="margin: 0; color: #fbbf24; font-size: 32px; letter-spacing: 1px;">Bling</h1>
                <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 16px;">The Developer Social Network</p>
            </div>
            <div style="padding: 40px 30px; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #f8fafc;">Reset your password</h2>
                <p>Hi there,</p>
                <p>We received a request to reset your password for your <strong>Bling</strong> account. Click the button below to choose a new password:</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetUrl}" style="background-color: #fbbf24; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s ease;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.</p>
                <p style="word-break: break-all; color: #fbbf24; font-size: 13px;">${resetUrl}</p>
                
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #64748b; text-align: center;">
                    If you're having trouble clicking the password reset button, copy and paste the URL above into your web browser.
                </p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #1e293b; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Bling App. All rights reserved.
            </div>
        </div>
    `
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('====================================================');
            console.log('EMAIL NOT CONFIGURED. MOCKING PASSWORD RESET EMAIL.');
            console.log(`To: ${to}`);
            console.log(`Reset URL: ${resetUrl}`);
            console.log('====================================================');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${to}`);
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw error;
    }
};
