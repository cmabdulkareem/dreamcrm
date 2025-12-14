import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

if (process.env.SENDGRID_API_KEY) {
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
    let transporter;

    if (process.env.SENDGRID_API_KEY) {
      console.log('🔧 Testing SendGrid connection...\n');

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
      console.log('🔧 Testing Gmail SMTP connection...\n');

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

    // Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    // Send test email
    console.log('Sending test email...\n');
    const testEmail = process.env.EMAIL_USER || process.env.EMAIL_FROM;

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

    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Possible issues:');
      if (process.env.SENDGRID_API_KEY) {
        console.error('   1. Invalid SendGrid API key');
        console.error('   2. API key doesn\'t have Mail Send permission');
        console.error('   3. Sender email not verified in SendGrid');
        console.error('   4. Check: https://app.sendgrid.com/settings/sender_auth/senders');
      } else {
        console.error('   1. Incorrect email or password');
        console.error('   2. If using Gmail, you need an App Password (not your regular password)');
        console.error('   3. Enable 2-Factor Authentication and generate an App Password');
        console.error('   4. Visit: https://myaccount.google.com/apppasswords');
      }
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('\n⚠️  Connection failed. Possible issues:');
      console.error('   1. Your hosting platform (Render/Heroku) might be blocking SMTP ports');
      console.error('   2. Solution: Use SendGrid instead of Gmail SMTP');
      console.error('   3. Sign up at: https://signup.sendgrid.com/');
      console.error('   4. Add SENDGRID_API_KEY to your .env file');
    } else if (error.responseCode === 403) {
      console.error('\n⚠️  Sender not verified (SendGrid):');
      console.error('   1. Go to: https://app.sendgrid.com/settings/sender_auth/senders');
      console.error('   2. Verify your sender email address');
      console.error('   3. Check your email for verification link');
    }

    console.error('\n📋 Full error details:');
    console.error(error);

    process.exit(1);
  }
}

testEmailConnection();
