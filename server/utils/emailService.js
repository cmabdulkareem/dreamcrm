import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

/* ============================================
   Email Service using Brevo API
   No SMTP - Works everywhere!
============================================ */

// Initialize Brevo
if (!process.env.BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY is not set! Email service will not work.');
  console.error('   Add BREVO_API_KEY to your .env file or environment variables.');
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

console.log('✅ Brevo email service initialized');

/* ============================================
   1. PASSWORD RESET EMAIL
============================================ */
const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    console.log('Sending password reset email via Brevo to:', user.email);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'DreamCRM' };
    sendSmtpEmail.to = [{ email: user.email, name: user.fullName }];
    sendSmtpEmail.subject = 'Password Reset Request';
    sendSmtpEmail.htmlContent = `
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

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Password reset email sent via Brevo. Message ID:', result.messageId);

  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    if (error.response?.body) {
      console.error('Brevo error details:', JSON.stringify(error.response.body, null, 2));
    }
    throw error;
  }
};

/* ============================================
   2. WELCOME EMAIL
============================================ */
const sendWelcomeEmail = async (user) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'DreamCRM' };
    sendSmtpEmail.to = [{ email: user.email, name: user.fullName }];
    sendSmtpEmail.subject = 'Welcome to Our CRM System!';
    sendSmtpEmail.htmlContent = `
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

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Welcome email sent via Brevo');

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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'DreamCRM' };
    sendSmtpEmail.to = adminEmails.map(email => ({ email }));
    sendSmtpEmail.subject = 'New User Registration';
    sendSmtpEmail.htmlContent = `
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

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Admin notification sent via Brevo');

  } catch (error) {
    console.error('Error sending new user notification:', error.message);
    throw error;
  }
};

/* ============================================
   4. STUDENT CREDENTIALS EMAIL
============================================ */
const sendStudentCredentialsEmail = async (user, password) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'DreamCRM' };
    sendSmtpEmail.to = [{ email: user.email, name: user.fullName }];
    sendSmtpEmail.subject = 'Your Student Portal Credentials';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
        <div style="background: #2563eb; padding: 25px; text-align: center; color: white;">
          <h2>Student Portal Access</h2>
        </div>

        <div style="padding: 25px;">
          <h3>Hello ${user.fullName},</h3>
          <p>Your account for the Student Portal has been created.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/student/login">Click here to login</a></p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</span></p>
          </div>

          <p>Please change your password after logging in for the first time.</p>
        </div>

        <div style="background: #0f172a; padding: 15px; text-align: center; color: #aaa;">
          This is an automated message. Do not reply.
        </div>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Student credentials email sent via Brevo');

  } catch (error) {
    console.error('Error sending student credentials email:', error.message);
    throw error;
  }
};

/* ============================================
   EXPORTS
============================================ */
export default {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetEmail,
  sendStudentCredentialsEmail
};
