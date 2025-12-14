# 🚀 Render Deployment - Environment Variables

Copy these to your Render service → **Environment** tab:

## Required Variables

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://dreamcrm:Cadd123@sample.kvxwkea.mongodb.net/dreamcrm
JWT_SECRET=mysecretkey
```

## Email Configuration - Option 1: Gmail SMTP (Try First)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=cmabdulkareem@gmail.com
EMAIL_PASS=skkglhamfpdnchsp
EMAIL_FROM=cmabdulkareem@gmail.com
```

## Email Configuration - Option 2: SendGrid (If Port 465 Fails)

```env
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=cmabdulkareem@gmail.com
```

---

## Steps to Deploy

1. **Update Environment Variables**
   - Go to Render Dashboard → Your Service → Environment
   - Update `EMAIL_PORT` to `465`
   - Click **Save Changes**

2. **Wait for Auto-Deploy**
   - Render will automatically redeploy

3. **Test Password Reset**
   - Go to: https://dreamcrms.vercel.app/forgot-password
   - Enter email and submit
   - Check Render logs for success message

4. **If Still Fails**
   - Sign up for SendGrid (free)
   - Add `SENDGRID_API_KEY` to environment variables
   - Redeploy

---

## Verify Deployment

Check Render logs for:
```
✅ Password reset email sent successfully to: [email]
```

Or if using SendGrid:
```
Using SendGrid for email delivery
✅ Password reset email sent successfully to: [email]
```
