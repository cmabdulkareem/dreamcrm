import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/* ============================================
   Create Email Transporter (Reusable)
============================================ */
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // use true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* ============================================
   1. PASSWORD RESET EMAIL
============================================ */
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransport();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
          <div style="background: #7e22ce; padding: 25px; text-align: center; color: white;">
            <h2>Password Reset</h2>
            <p>Reset your CRM account password</p>
          </div>

          <div style="padding: 25px;">
            <h3>Hello ${user.fullName},</h3>
            <p>You requested to reset your password. Click the button below:</p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" 
                 style="background: #7e22ce; padding: 10px 25px; color: white; border-radius: 30px; text-decoration: none;">
                Reset Password
              </a>
            </div>

            <p>If the button doesn't work, copy this link:</p>
            <p>${resetUrl}</p>

            <p>If you didn’t request this, ignore this message.</p>
          </div>

          <div style="background: #0f172a; padding: 15px; text-align: center; color: #aaa;">
            This is an automated message. Do not reply.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
};

/* ============================================
   2. WELCOME EMAIL
============================================ */
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransport();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Our CRM System!',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
          <div style="background: #1e3a8a; padding: 25px; text-align: center; color: white;">
            <h2>Welcome to Our CRM</h2>
          </div>

          <div style="padding: 25px;">
            <h3>Hello ${user.fullName},</h3>
            <p>Your CRM account is ready to use.</p>

            <table style="width:100%; margin: 15px 0;">
              <tr><td><b>Name:</b></td><td>${user.fullName}</td></tr>
              <tr><td><b>Email:</b></td><td>${user.email}</td></tr>
              <tr><td><b>Phone:</b></td><td>${user.phone}</td></tr>
            </table>

            <p>Use your credentials to access the CRM.</p>
          </div>

          <div style="background: #0f172a; padding: 15px; text-align: center; color: #aaa;">
            This is an automated message. Do not reply.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    throw error;
  }
};

/* ============================================
   3. NEW USER NOTIFICATION TO ADMINS
============================================ */
const sendNewUserNotification = async (user, adminEmails) => {
  try {
    if (!adminEmails?.length) return;

    const transporter = createTransport();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmails,
      subject: 'New User Registration',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
          <div style="background: #0f766e; padding: 25px; text-align: center; color: white;">
            <h2>New User Registered</h2>
          </div>

          <div style="padding: 25px;">
            <p>A new user has registered in the CRM.</p>

            <table style="width:100%; margin: 15px 0;">
              <tr><td><b>Name:</b></td><td>${user.fullName}</td></tr>
              <tr><td><b>Email:</b></td><td>${user.email}</td></tr>
              <tr><td><b>Phone:</b></td><td>${user.phone}</td></tr>
              <tr><td><b>Registered On:</b></td><td>${new Date().toLocaleString()}</td></tr>
            </table>

            <p>Please review and assign the appropriate role.</p>
          </div>

          <div style="background: #0f172a; padding: 15px; text-align: center; color: #aaa;">
            This is an automated message. Do not reply.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Admin notification sent.');
  } catch (error) {
    console.error('Error sending new user notification:', error.message);
    throw error;
  }
};

/* ============================================
   EXPORTS
============================================ */
export default {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetEmail
};
