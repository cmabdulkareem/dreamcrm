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
import Event from './model/eventModel.js';
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

// Specific route for event registration to inject meta tags for social media crawlers
app.get('/event-registration/:link', async (req, res) => {
  try {
    const { link } = req.params;
    const event = await Event.findOne({ registrationLink: link, isActive: true });

    const indexPath = path.join(__dirname, '../dist/index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send('Site building in progress...');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    if (event) {
      const title = `${event.eventName} | Dream CRM`;
      const description = event.eventDescription || 'Register for this event';
      const origin = req.protocol + '://' + req.get('host');
      let imageUrl = `${origin}/favicon.png`;

      if (event.bannerImage) {
        imageUrl = event.bannerImage.startsWith('http')
          ? event.bannerImage
          : `${origin}${event.bannerImage.startsWith('/') ? '' : '/'}${event.bannerImage}`;
      }

      const url = `${origin}/event-registration/${link}`;

      // Construct metadata block
      const metadata = `
    <!-- METADATA_START -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${imageUrl}" />
    <!-- METADATA_END -->`;

      // Inject into HTML
      html = html.replace(/<!-- METADATA_START -->[\s\S]*<!-- METADATA_END -->/, metadata);
    }

    res.send(html);
  } catch (error) {
    console.error('Meta injection error:', error);
    // Fallback to sending standard file
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Server Error');
    }
  }
});



// Catch-all route to serve index.html for client-side routing
app.use((req, res, next) => {
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