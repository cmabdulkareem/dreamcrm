import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '❌ NOT SET');
console.log('\n');

// Test email connection
async function testEmailConnection() {
    try {
        console.log('Testing SMTP connection...\n');

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');

        // Send test email
        console.log('Sending test email...\n');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself for testing
            subject: 'Test Email - CRM Password Reset',
            html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
          <div style="background: #7e22ce; padding: 25px; text-align: center; color: white;">
            <h2>Email Configuration Test</h2>
          </div>
          <div style="padding: 25px;">
            <h3>Success!</h3>
            <p>Your email configuration is working correctly.</p>
            <p>This test was run at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\nCheck your inbox at:', process.env.EMAIL_USER);

    } catch (error) {
        console.error('❌ Email test failed!');
        console.error('Error:', error.message);

        if (error.code === 'EAUTH') {
            console.error('\n⚠️  Authentication failed. Possible issues:');
            console.error('   1. Incorrect email or password');
            console.error('   2. If using Gmail, you need an App Password (not your regular password)');
            console.error('   3. Enable 2-Factor Authentication and generate an App Password');
            console.error('   4. Visit: https://myaccount.google.com/apppasswords');
        } else if (error.code === 'ECONNECTION') {
            console.error('\n⚠️  Connection failed. Possible issues:');
            console.error('   1. Check your internet connection');
            console.error('   2. Firewall might be blocking port 587');
            console.error('   3. SMTP server might be down');
        }

        console.error('\nFull error details:', error);
    }
}

testEmailConnection();
