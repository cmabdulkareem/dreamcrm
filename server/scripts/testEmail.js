import * as brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ SET (starts with: ' + process.env.BREVO_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
console.log('\n');

// Test email connection
async function testEmailConnection() {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY is not set!');
      console.error('   Add it to your .env file:');
      console.error('   BREVO_API_KEY=your-api-key-here');
      process.exit(1);
    }

    const testEmail = process.env.EMAIL_FROM;

    console.log('🔧 Testing Brevo...\n');

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: process.env.EMAIL_FROM, name: 'DreamCRM Test' };
    sendSmtpEmail.to = [{ email: testEmail, name: 'Test User' }];
    sendSmtpEmail.subject = 'Test Email - CRM Password Reset';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial; max-width: 600px; margin: auto; background: #fff;">
        <div style="background: #7e22ce; padding: 25px; text-align: center; color: white;">
          <h2>✅ Brevo Test Successful!</h2>
        </div>
        <div style="padding: 25px;">
          <h3>Configuration Working</h3>
          <p>Your Brevo email configuration is working correctly.</p>
          <p><strong>Service:</strong> Brevo (formerly Sendinblue)</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Test email sent successfully via Brevo!');
    console.log('Message ID:', result.messageId);
    console.log('\n📬 Check your inbox at:', testEmail);
    console.log('\n🎉 Brevo configuration is working correctly!');

  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);

    if (error.response?.body) {
      console.error('Brevo error details:', JSON.stringify(error.response.body, null, 2));
    }

    if (error.code === 'unauthorized' || error.statusCode === 401) {
      console.error('\n⚠️  Authentication failed:');
      console.error('   1. Invalid Brevo API key');
      console.error('   2. Check your API key at: https://app.brevo.com/settings/keys/api');
    } else if (error.code === 'invalid_parameter' || error.message?.includes('sender')) {
      console.error('\n⚠️  Sender email issue:');
      console.error('   1. Verify sender email at: https://app.brevo.com/senders');
      console.error('   2. Make sure', process.env.EMAIL_FROM, 'is verified');
    }

    console.error('\n📋 Full error details:');
    console.error(error);

    process.exit(1);
  }
}

testEmailConnection();
