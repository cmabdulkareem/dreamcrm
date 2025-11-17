# CRM Server

## Email Configuration

To enable email functionality, you need to configure the following environment variables in the `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Gmail Setup Instructions

1. If using Gmail, you'll need to generate an App Password:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Use this password as the `EMAIL_PASS` value

2. Replace `your-email@gmail.com` with your actual Gmail address

### Other Email Providers

For other email providers, update the `EMAIL_HOST` and `EMAIL_PORT` values accordingly:
- Outlook/Hotmail: `EMAIL_HOST=smtp-mail.outlook.com`, `EMAIL_PORT=587`
- Yahoo: `EMAIL_HOST=smtp.mail.yahoo.com`, `EMAIL_PORT=587`

## Email Functionality

The system automatically sends:
- A welcome email to new users upon registration
- A notification email to admins when a new user signs up

## Testing Email Functionality

To test the email functionality, you can temporarily add a test script to package.json and run it.