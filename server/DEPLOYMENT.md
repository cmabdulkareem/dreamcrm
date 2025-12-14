# 🚀 Production Deployment Guide - Render

## Quick Setup for Email on Render

### Step 1: Update Environment Variables

Go to your Render service → **Environment** tab and add/update:

```env
NODE_ENV=production
EMAIL_PORT=465
```

**Save Changes** and Render will auto-redeploy.

---

### Step 2: Test Password Reset

1. Wait for deployment to complete
2. Try password reset at: https://dreamcrms.vercel.app/forgot-password
3. Check Render logs for:
   ```
   Using Gmail SMTP: smtp.gmail.com:465 (secure: true)
   ✅ Password reset email sent successfully
   ```

---

## If Port 465 Still Fails → Use SendGrid

### 1. Sign Up for SendGrid (Free)
- Go to: https://signup.sendgrid.com/
- Free tier: 100 emails/day

### 2. Create API Key
- Dashboard: https://app.sendgrid.com/settings/api_keys
- Click **Create API Key**
- Name: `CRM Password Reset`
- Permission: **Full Access**
- **Copy the key** (starts with `SG.`)

### 3. Verify Sender Email
- Go to: https://app.sendgrid.com/settings/sender_auth/senders
- Click **Create New Sender**
- Use: `cmabdulkareem@gmail.com`
- Check email and verify

### 4. Add to Render Environment Variables
```env
SENDGRID_API_KEY=SG.your-api-key-here
```

### 5. Redeploy & Test
The code auto-detects SendGrid. Check logs for:
```
Using SendGrid for email delivery
✅ Password reset email sent successfully
```

---

## Current Configuration

### CORS Origins (Auto-detected for password reset URLs)
```javascript
[
  "https://dreamcrms.vercel.app",      // Production frontend
  "https://dreamcrm.onrender.com",     // Production backend  
  "http://localhost:5173",             // Development
  "http://localhost:5174"              // Development (alt)
]
```

### Email Settings
- **Development**: Gmail SMTP (port 465)
- **Production**: SendGrid (recommended) or Gmail SMTP (port 465)

---

## Troubleshooting

### Check Logs
On Render dashboard → **Logs** tab, look for:
- `✅ Password reset email sent successfully` = Working!
- `❌ Failed to send password reset email` = Check error details

### Common Issues

**"Connection timeout"**
→ Use SendGrid instead of Gmail SMTP

**"Invalid login"**
→ Verify Gmail App Password is correct

**"Sender not verified"** (SendGrid)
→ Verify sender email in SendGrid dashboard

---

## Files Reference

- [`emailService.js`](file:///e:/crm/server/utils/emailService.js) - Email logic with SendGrid support
- [`urlHelper.js`](file:///e:/crm/server/utils/urlHelper.js) - Dynamic URL detection
- [`corsOptions.js`](file:///e:/crm/server/config/corsOptions.js) - Allowed frontend URLs
- [`.env.example`](file:///e:/crm/server/.env.example) - Configuration template

---

## Summary

✅ Port 465 configured (try first)  
✅ SendGrid integrated (fallback)  
✅ Dynamic URL detection working  
✅ Production ready  

**Next**: Update `EMAIL_PORT=465` on Render and test!
