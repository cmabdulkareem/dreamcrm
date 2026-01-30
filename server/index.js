import express from 'express'
import compression from 'compression'
import http from 'http'
import { config } from 'dotenv'
import cors from 'cors'
import corsOptions from './config/corsOptions.js'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
config({ quiet: true })

import './config/db.js'
import routes from './routes/userRoutes.js'
import setupSocket from './realtime/socket.js'
import customerRoutes from './routes/customerRoutes.js'
import campaignRoutes from './routes/campaignRoute.js'
import emailRoutes from './routes/emailRoute.js'
import profileRoutes from './routes/profileRoute.js'
import studentRoutes from './routes/studentRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import contactPointRoutes from './routes/contactPointRoute.js'

import eventRoutes from './routes/eventRoutes.js'
import leaveRoutes from './routes/leaveRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import courseCategoryRoutes from './routes/courseCategoryRoute.js'
import monthlyTargetRoutes from './routes/monthlyTargetRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import batchRoutes from './routes/batchRoutes.js'
import callListRoutes from './routes/callListRoutes.js'
import backupRoutes from './routes/backupRoutes.js'
import invoiceRoutes from "./routes/invoiceRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
const app = express()

// Trust proxy is required for Render/Heroku to correctly detect protocol (http vs https)
app.set('trust proxy', 1);

// Serve static files from uploads directory
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use(cors(corsOptions))
app.use(compression())

import { getBaseUploadDir } from './utils/uploadHelper.js';

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(getBaseUploadDir()));

// Serve static files from dist directory (built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve static files from public directory (images, favicon, etc.)
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/users', routes)
app.use('/api/customers', customerRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/course-categories', courseCategoryRoutes)
app.use('/api/contact-points', contactPointRoutes)

app.use('/api/events', eventRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/monthly-targets', monthlyTargetRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/call-lists', callListRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/receipts', receiptRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/support', supportRoutes)



// Catch-all route to serve index.html for client-side routing
app.get('*', async (req, res, next) => {
  // Do not hijack API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Do not hijack uploaded files
  if (req.path.startsWith('/uploads/')) {
    return next();
  }

  const indexPath = path.join(__dirname, '../dist/index.html');

  if (fs.existsSync(indexPath)) {
    // Dynamic meta tags for event registration
    if (req.path.startsWith('/event-registration/')) {
      try {
        const link = req.path.split('/').pop();
        const event = await eventModel.findOne({ registrationLink: link, isActive: true });

        if (event) {
          let html = fs.readFileSync(indexPath, 'utf8');

          const title = `${event.eventName} - Registration`;
          const description = event.eventDescription || 'Register for this event';
          const protocol = req.protocol === 'https' ? 'https' : 'http'; // Trust proxy is handled above
          const fullUrl = `${protocol}://${req.get('host')}${req.originalUrl}`;
          const imageUrl = event.bannerImage 
            ? `${protocol}://${req.get('host')}${event.bannerImage}`
            : `${protocol}://${req.get('host')}/favicon.png`;

          // Inject Meta Tags
          const metaTags = `
    <!-- Social Media Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
          `;

          // Replace existing title if any, or just append to head
          if (html.includes('<title>')) {
            html = html.replace(/<title>.*?<\/title>/, metaTags);
          } else {
            html = html.replace('</head>', `${metaTags}\n  </head>`);
          }

          return res.send(html);
        }
      } catch (error) {
        console.error("Error in server-side meta injection:", error);
        // Fallback to normal serving on error
      }
    }

    return res.sendFile(indexPath);
  }

  // Dev / fallback case
  res.status(404).json({
    message: 'Resource not found',
    env: process.env.NODE_ENV,
    hint:
      'If you are in development, access frontend via dev server (e.g. http://localhost:5173)'
  });
});

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});