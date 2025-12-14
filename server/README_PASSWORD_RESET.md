# Password Reset - Quick Reference

## 🚀 What Changed

### Smart URL Detection
- ❌ **Before**: Hardcoded `CLIENT_URL=http://localhost:5173` in `.env`
- ✅ **After**: Automatically detects URL from CORS configuration

### How It Works
```javascript
// Request comes from https://dreamcrms.vercel.app
getFrontendUrl(req) → "https://dreamcrms.vercel.app"

// Request comes from http://localhost:5173
getFrontendUrl(req) → "http://localhost:5173"
```

---

## 📝 To Add a New Domain

**Just update CORS config** - that's it!

```javascript
// server/config/corsOptions.js
const corsOptions = {
  origin: [
    "https://your-new-domain.com",  // ← Add here
    "https://dreamcrms.vercel.app",
    "http://localhost:5173"
  ],
  // ...
};
```

No `.env` changes needed! 🎉

---

## 🔧 Troubleshooting

### Email Not Sending?

1. **Use Gmail App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate password
   - Update `EMAIL_PASS` in `.env`

2. **Check Server Logs**
   ```bash
   # Look for:
   ✅ Password reset email sent successfully
   # or
   ❌ Failed to send password reset email
   ```

3. **Test Email Config**
   ```bash
   cd server
   node scripts/testEmail.js
   ```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| [`urlHelper.js`](file:///e:/crm/server/utils/urlHelper.js) | Dynamic URL detection |
| [`corsOptions.js`](file:///e:/crm/server/config/corsOptions.js) | **Single source of truth** for URLs |
| [`userController.js`](file:///e:/crm/server/controller/userController.js#L860) | Password reset logic |
| [`.env`](file:///e:/crm/server/.env) | Email credentials only |

---

## ✅ Deployment Checklist

- [ ] Add new domain to `corsOptions.js`
- [ ] Set email credentials in production environment variables
- [ ] Restart server
- [ ] Test password reset flow

---

## 🎯 Current CORS Origins

```javascript
[
  "https://dreamcrms.vercel.app",      // Production frontend
  "https://dreamcrm.onrender.com",     // Production backend
  "http://localhost:5173",             // Development
  "http://localhost:5174"              // Development (alt)
]
```

**These are your allowed frontend URLs** - password reset emails will use whichever one the request came from.
