import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (process.env.RESEND_API_KEY) {
  console.log('\n📧 Resend Configuration:');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ SET (starts with: ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : '❌ NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
} else if (process.env.SENDGRID_API_KEY) {
  console.log('\n📧 SendGrid Configuration:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ SET (starts with: ' + process.env.SENDGRID_API_KEY.substring(0, 5) + '...)' : '❌ NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
} else {
  console.log('\n📧 Gmail SMTP Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
}

console.log('\n');

// Test email connection
async function testEmailConnection() {
  try {
    const testEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    // Try Resend first
    if (process.env.RESEND_API_KEY) {
      console.log('🔧 Testing Resend...\n');

      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: testEmail,
        subject: 'Test Email - CRM Password Reset',
        html: `
          <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
            <div style="background: #7e22ce; padding: 25px; text-align: center; color: white;">
              <h2>✅ Resend Test Successful!</h2>
            </div>
            <div style="padding: 25px;">
              <h3>Configuration Working</h3>
              <p>Your Resend email configuration is working correctly.</p>
              <p><strong>Service:</strong> Resend</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('❌ Resend error:', error);
        throw error;
      }

      console.log('✅ Test email sent successfully via Resend!');
      console.log('Email ID:', data.id);
      console.log('\n📬 Check your inbox at:', testEmail);
      console.log('\n🎉 Resend configuration is working correctly!');
      return;
    }

    // Fallback to SMTP testing (same as before)
    let transporter;

    if (process.env.SENDGRID_API_KEY) {
      console.log('🔧 Testing SendGrid...\n');
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else {
      console.log('🔧 Testing Gmail SMTP...\n');
      const port = parseInt(process.env.EMAIL_PORT) || 465;
      const secure = port === 465;

      transporter = nodemailer.createTransport({
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
      });

      console.log(`Using: ${process.env.EMAIL_HOST}:${port} (secure: ${secure})\n`);
    }

    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    console.log('Sending test email...\n');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Test Email - CRM Password Reset',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
          <div style="background: #7e22ce; padding: 25px; text-align: center; color: white;">
            <h2>✅ Email Test Successful!</h2>
          </div>
          <div style="padding: 25px;">
            <h3>Configuration Working</h3>
            <p>Your email configuration is working correctly.</p>
            <p><strong>Service:</strong> ${process.env.SENDGRID_API_KEY ? 'SendGrid' : 'Gmail SMTP'}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Check your inbox at:', testEmail);
    console.log('\n🎉 Email configuration is working correctly!');

  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);

    if (error.code === 'EAUTH' || error.statusCode === 401) {
      console.error('\n⚠️  Authentication failed. Possible issues:');
      if (process.env.RESEND_API_KEY) {
        console.error('   1. Invalid Resend API key');
        console.error('   2. Check your API key at: https://resend.com/api-keys');
      } else if (process.env.SENDGRID_API_KEY) {
        console.error('   1. Invalid SendGrid API key');
        console.error('   2. Check: https://app.sendgrid.com/settings/api_keys');
      } else {
        console.error('   1. Incorrect email or password');
        console.error('   2. Use Gmail App Password: https://myaccount.google.com/apppasswords');
      }
    } else if (error.statusCode === 403 || error.message?.includes('not verified')) {
      console.error('\n⚠️  Email address not verified:');
      console.error('   1. Verify your email domain at: https://resend.com/domains');
      console.error('   2. Or use the default: onboarding@resend.dev');
    }

    console.error('\n📋 Full error details:');
    console.error(error);

    process.exit(1);
  }
}

testEmailConnection();
