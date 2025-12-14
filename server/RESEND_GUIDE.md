# 🚀 Resend Email Service - Deployment Guide

## ✅ What's Configured

Resend is now your **primary email service** with automatic fallbacks:
1. **Resend** (primary) - Works everywhere, no port blocking
2. SendGrid (fallback) - If Resend fails
3. Gmail SMTP (fallback) - If both fail

---

## 📋 Render Deployment Steps

### Step 1: Add Environment Variable

Go to Render Dashboard → Your Service → **Environment** tab:

```env
RESEND_API_KEY=re_eZx3BVXN_9sbfXxAxuAK4orjTLoLeREjc
EMAIL_FROM=onboarding@resend.dev
```

Click **Save Changes** - Render will auto-deploy.

### Step 2: Test Password Reset

1. Go to: https://dreamcrms.vercel.app/forgot-password
2. Enter any registered email
3. Click "Send Reset Link"
4. Check Render logs for:
   ```
   ✅ Resend email service initialized
   Sending password reset email via Resend to: [email]
   ✅ Password reset email sent via Resend. ID: [email-id]
   ```

---

## 📧 Email Domain Setup (Optional - For Custom Domain)

Currently using `onboarding@resend.dev` (Resend's default domain).

### To Use Your Own Domain (e.g., `noreply@dreamcrm.com`):

1. **Add Domain in Resend**:
   - Go to: https://resend.com/domains
   - Click "Add Domain"
   - Enter: `dreamcrm.com`

2. **Add DNS Records**:
   - Copy the DNS records from Resend
   - Add them to your domain's DNS settings
   - Wait for verification (~5-30 minutes)

3. **Update Environment Variable**:
   ```env
   EMAIL_FROM=noreply@dreamcrm.com
   ```

> [!NOTE]
> The default `onboarding@resend.dev` works perfectly fine and doesn't require any setup!

---

## 🧪 Testing

### Local Test
```bash
cd server
node scripts/testEmail.js
```

Expected output:
```
✅ Resend email service initialized
🔧 Testing Resend...
✅ Test email sent successfully via Resend!
Email ID: [unique-id]
📬 Check your inbox at: onboarding@resend.dev
```

### Production Test
After deploying to Render, test the password reset flow and check logs.

---

## 🔧 Troubleshooting

### Error: "Email address not verified"

**Solution**: Use the default domain:
```env
EMAIL_FROM=onboarding@resend.dev
```

### Error: "Invalid API key"

**Solution**: 
1. Check API key at: https://resend.com/api-keys
2. Make sure it starts with `re_`
3. Verify it's copied correctly (no extra spaces)

### Emails Not Received

**Check**:
1. Spam/junk folder
2. Resend dashboard: https://resend.com/emails
3. Check if email was sent successfully
4. Verify recipient email is correct

---

## 📊 Resend vs Others

| Feature | Resend | SendGrid | Gmail SMTP |
|---------|--------|----------|------------|
| **Setup** | ✅ Instant | Medium | Easy |
| **Works on Render** | ✅ Yes | ✅ Yes | ❌ Often blocked |
| **Free Tier** | 100/day, 3,000/month | 100/day | Unlimited |
| **Reliability** | ✅ Excellent | ✅ Excellent | ⚠️ Variable |
| **Modern API** | ✅ Yes | No | No |
| **Dashboard** | ✅ Great | Good | N/A |

---

## 📁 Files Changed

- [`emailService.js`](file:///e:/crm/server/utils/emailService.js) - Resend integration
- [`.env`](file:///e:/crm/server/.env) - API key configured
- [`testEmail.js`](file:///e:/crm/server/scripts/testEmail.js) - Resend testing

---

## Summary

✅ Resend integrated and ready  
✅ No SMTP port blocking issues  
✅ Works immediately with default domain  
✅ Optional custom domain setup available  

**Next**: Add `RESEND_API_KEY` to Render and test! 🎉
