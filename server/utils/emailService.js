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
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'CDC Insights' };
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
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'CDC Insights' };
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
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'CDC Insights' };
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
   5. INTERVIEW INVITE EMAIL
============================================ */
const sendInterviewInviteEmail = async (application, job, notes) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'CDC Insights' };
    sendSmtpEmail.to = [{ email: application.email, name: application.fullName }];
    sendSmtpEmail.subject = `Interview Invitation: ${job.title} - CDC Insights`;

    const formattedDate = new Date(application.interviewDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    sendSmtpEmail.htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Interview Invitation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">We're excited to meet you!</span></p>
        </div>

        <div style="padding: 40px 30px;">
          <h3 style="color: #1e293b; margin-top: 0;">Hello ${application.fullName},</h3>
          <p style="color: #475569; line-height: 1.6;">Thank you for your interest in the <strong>${job.title}</strong> position at <strong>CDC Insights</strong>. We have reviewed your application and would like to invite you for an interview.</p>

          <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h4 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Interview Schedule</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; color: #1e293b;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; color: #1e293b;">${application.interviewTime}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Notes:</strong></td>
                <td style="padding: 8px 0; color: #1e293b; line-height: 1.5;">${notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="color: #475569; line-height: 1.6;">Please confirm your availability for this slot. If you need to reschedule, kindly let us know at your earliest convenience.</p>
          
          <div style="text-align: center; margin-top: 40px;">
            <div style="display: inline-block; padding: 12px 30px; background: #1e3a8a; color: white; border-radius: 8px; font-weight: 700; text-decoration: none;">Please be on time</div>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 25px; text-align: center; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} CDC Insights. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated notification from our Recruitment Portal.</p>
        </div>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Interview invite sent to ${application.email}`);

  } catch (error) {
    console.error('❌ Error sending interview invite:', error.message);
    if (error.response?.body) {
      console.error('Brevo error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
};

/* ============================================
   6. ONBOARDING INVITATION EMAIL
============================================ */
const sendOnboardingInviteEmail = async (application, token) => {
  try {
    const onboardingUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/onboarding/${token}`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'CDC Insights' };
    sendSmtpEmail.to = [{ email: application.email, name: application.fullName }];
    sendSmtpEmail.subject = `Job Offer & Onboarding: CDC Insights`;

    sendSmtpEmail.htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Congratulations!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">We're pleased to offer you a position at CDC Insights</p>
        </div>

        <div style="padding: 40px 30px;">
          <h3 style="color: #1e293b; margin-top: 0;">Hello ${application.fullName},</h3>
          <p style="color: #475569; line-height: 1.6;">It is our pleasure to extend an offer of employment to you! We were very impressed with your background and are excited to have you join our team.</p>

          <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Next Steps</h4>
            <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">To proceed with your onboarding, please review and digitally sign the employment agreement through our secure portal.</p>
          </div>

          <div style="text-align: center; margin-top: 35px; margin-bottom: 35px;">
            <a href="${onboardingUrl}" 
               style="display: inline-block; padding: 14px 35px; background: #059669; color: white; border-radius: 10px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Review & Sign Agreement
            </a>
          </div>

          <p style="color: #475569; line-height: 1.6; font-size: 14px;"><strong>Note:</strong> This link is unique to you and should not be shared. It will allow you to access your personalized onboarding documents.</p>
        </div>

        <div style="background: #f1f5f9; padding: 25px; text-align: center; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} CDC Insights. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated notification from our HR Onboarding System.</p>
        </div>
      </div>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Onboarding invite sent to ${application.email}`);

  } catch (error) {
    console.error('❌ Error sending onboarding invite:', error.message);
  }
};

/* ============================================
   EXPORTS
============================================ */
export default {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetEmail,
  sendStudentCredentialsEmail,
  sendInterviewInviteEmail,
  sendOnboardingInviteEmail
};
