import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create a transporter for sending emails
 * Uses Gmail SMTP by default, but can be configured for other providers
 */
const createTransport = () => {
  // For production, you would use environment variables for these values
  // For now, we'll use a default configuration that can be overridden
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });

  return transporter;
};

/**
 * Send a welcome email to a new user
 * @param {Object} user - The user object containing email and fullName
 */
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransport();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Welcome to Our CRM System!',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Our CRM</h1>
            <p style="color: #e0f2fe; margin: 10px 0 0; font-size: 16px;">Your journey starts here</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Hello ${user.fullName}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6;">Welcome aboard! We're thrilled to have you join our team. Your account has been successfully created and is ready to use.</p>
            
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #1e3a8a; margin-top: 0;">Your Account Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Full Name:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Phone:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.phone}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">You can now log in to our CRM system using your email and the password you created during registration.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">Access Your Account</a>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">If you have any questions or need assistance, feel free to reach out to our support team.</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #cbd5e1; margin: 0; font-size: 14px;">Best regards,<br/><span style="color: white; font-weight: bold;">The CRM Team</span></p>
          </div>
          
          <div style="background-color: #0f172a; padding: 15px; text-align: center;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', user.email);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send a notification email to admins when a new user signs up
 * @param {Object} user - The new user object
 * @param {Array} adminEmails - Array of admin email addresses
 */
export const sendNewUserNotification = async (user, adminEmails) => {
  try {
    if (!adminEmails || adminEmails.length === 0) return;
    
    const transporter = createTransport();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'your-email@gmail.com',
      to: adminEmails,
      subject: 'New User Registration',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">New User Registration</h1>
            <p style="color: #ccfbf1; margin: 10px 0 0; font-size: 16px;">Action required: Review new account</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #0f766e; margin-top: 0;">New Team Member Alert 🚨</h2>
            
            <p style="color: #374151; line-height: 1.6;">A new user has registered in the CRM system. Please review the account details and assign appropriate roles if necessary.</p>
            
            <div style="background-color: #f0fdfa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #14b8a6;">
              <h3 style="color: #0f766e; margin-top: 0;">User Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Full Name:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Email:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Phone:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${user.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Registration Date:</td>
                  <td style="padding: 8px 0; color: #4b5563;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">Review Account</a>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">Please ensure that the appropriate roles and permissions are assigned to this user based on their position and responsibilities.</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #cbd5e1; margin: 0; font-size: 14px;">Best regards,<br/><span style="color: white; font-weight: bold;">The CRM System</span></p>
          </div>
          
          <div style="background-color: #0f172a; padding: 15px; text-align: center;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              This is an automated notification. Please do not reply to this message.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('New user notification email sent to admins');
    return info;
  } catch (error) {
    console.error('Error sending new user notification:', error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetEmail
};

/**
 * Send a password reset email to a user
 * @param {Object} user - The user object containing email and fullName
 * @param {string} resetToken - The password reset token
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransport();
    
    // Create reset URL (you'll need to update this to match your frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #7e22ce 0%, #a855f7 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Password Reset</h1>
            <p style="color: #f3e8ff; margin: 10px 0 0; font-size: 16px;">Reset your account password</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #7e22ce; margin-top: 0;">Hello ${user.fullName}! 👋</h2>
            
            <p style="color: #374151; line-height: 1.6;">We received a request to reset your password for your CRM account. If you didn't make this request, you can safely ignore this email.</p>
            
            <div style="background-color: #f5f3ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #a855f7;">
              <h3 style="color: #7e22ce; margin-top: 0;">Password Reset Instructions</h3>
              <p style="color: #374151; line-height: 1.6;">Click the button below to reset your password. This link will expire in 1 hour.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #7e22ce 0%, #a855f7 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #7e22ce; word-break: break-all;">${resetUrl}</a></p>
            
            <p style="color: #374151; line-height: 1.6;">If you continue to have issues accessing your account, please contact our support team.</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #cbd5e1; margin: 0; font-size: 14px;">Best regards,<br/><span style="color: white; font-weight: bold;">The CRM Team</span></p>
          </div>
          
          <div style="background-color: #0f172a; padding: 15px; text-align: center;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', user.email);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};