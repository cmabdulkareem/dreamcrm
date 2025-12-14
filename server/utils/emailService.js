import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/* ============================================
   Email Service with Multiple Providers
   Priority: Resend > SendGrid > Gmail SMTP
============================================ */

// Initialize Resend if API key is available
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service initialized');
}

/* ============================================
   Create SMTP Transporter (Fallback)
============================================ */
const createTransport = () => {
  // Check if using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('Using SendGrid for email delivery');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Otherwise use Gmail SMTP
  const port = parseInt(process.env.EMAIL_PORT) || 465;
  const secure = port === 465;

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  console.log(`Using Gmail SMTP: ${config.host}:${config.port} (secure: ${config.secure})`);

  return nodemailer.createTransport(config);
};

/* ============================================
   1. PASSWORD RESET EMAIL
============================================ */
const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    const emailHtml = `
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
          <p style="word-break: break-all;">${resetUrl}</p>

          <p>If you didn't request this, ignore this message.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">This link will expire in 1 hour.</p>
        </div>

        <div style="background: #0f172a; padding: 15px; text-align: center; color: #aaa;">
          This is an automated message. Do not reply.
        </div>
      </div>
    `;

    // Try Resend first (if available)
    if (resend) {
      console.log('Sending password reset email via Resend to:', user.email);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: user.email,
        subject: 'Password Reset Request',
        html: emailHtml,
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent via Resend. ID:', data.id);
      return;
    }

    // Fallback to SMTP (SendGrid or Gmail)
    const transporter = createTransport();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent via SMTP to:', user.email);

  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw error;
  }
};

/* ============================================
   2. WELCOME EMAIL
============================================ */
const sendWelcomeEmail = async (user) => {
  try {
    const emailHtml = `
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
    `;

    // Try Resend first
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: user.email,
        subject: 'Welcome to Our CRM System!',
        html: emailHtml,
      });

      if (error) throw error;
      console.log('✅ Welcome email sent via Resend');
      return;
    }

    // Fallback to SMTP
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Our CRM System!',
      html: emailHtml
    });
    console.log('✅ Welcome email sent via SMTP');

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

    const emailHtml = `
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
    `;

    // Try Resend first
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: adminEmails,
        subject: 'New User Registration',
        html: emailHtml,
      });

      if (error) throw error;
      console.log('✅ Admin notification sent via Resend');
      return;
    }

    // Fallback to SMTP
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmails,
      subject: 'New User Registration',
      html: emailHtml
    });
    console.log('✅ Admin notification sent via SMTP');

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
