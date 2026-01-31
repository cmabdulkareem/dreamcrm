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
import prospectDatabaseRoutes from "./routes/prospectDatabaseRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import studentPortalRoutes from "./routes/studentPortalRoutes.js";
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
app.use('/api/prospect-database', prospectDatabaseRoutes)
app.use('/api/holidays', holidayRoutes)
app.use('/api/student-portal', studentPortalRoutes);

// Helper to get index.html content (with caching)
let indexHtmlCache = null;
const getIndexHtml = (forceReload = false) => {
  if (indexHtmlCache && !forceReload) return indexHtmlCache;
  const distPath = path.join(__dirname, '../dist/index.html');
  const rootPath = path.join(__dirname, '../index.html');
  const indexPath = fs.existsSync(distPath) ? distPath : rootPath;

  if (fs.existsSync(indexPath)) {
    indexHtmlCache = fs.readFileSync(indexPath, 'utf8');
    return indexHtmlCache;
  }
  return null;
};

// Helper to inject metadata into HTML
const injectMetadata = (html, metadata) => {
  if (!html) return null;
  const { title, description, url, image } = metadata;
  const tags = `
    <!-- DYNAMIC_METADATA_START -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${image}" />
    <!-- DYNAMIC_METADATA_END -->`;

  // 1. Remove markers and competing tags
  let result = html.replace(/<!-- METADATA_START -->[\s\S]*<!-- METADATA_END -->/, '');
  result = result.replace(/<!-- DYNAMIC_METADATA_START -->[\s\S]*<!-- DYNAMIC_METADATA_END -->/, '');
  result = result.replace(/<title>[\s\S]*?<\/title>/gi, '');
  result = result.replace(/<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
  result = result.replace(/<meta\s+property=["']og:[\s\S]*?["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
  result = result.replace(/<meta\s+name=["']twitter:[\s\S]*?["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');

  // 2. Inject at head top
  return result.replace(/<head>/i, `<head>${tags}`);
};

// Specific route for event registration to inject meta tags for social media crawlers
app.get('/event-registration/:link', async (req, res) => {
  try {
    const { link } = req.params;
    const event = await Event.findOne({ registrationLink: link, isActive: true });

    const html = getIndexHtml();
    if (!html) {
      return res.status(404).send('Site building in progress...');
    }

    let origin = req.protocol + '://' + req.get('host');
    if (!origin.includes('localhost')) origin = origin.replace('http://', 'https://');

    const metadata = {
      title: event ? `${event.eventName} | Dream CRM` : "Dream CRM - Streamline Your Business",
      description: event ? (event.eventDescription || 'Register for this event') : "Manage leads, students, events, and more with our comprehensive CRM solution.",
      url: `${origin}/event-registration/${link}`,
      image: event && event.bannerImage
        ? (event.bannerImage.startsWith('http') ? event.bannerImage : `${origin}${event.bannerImage.startsWith('/') ? '' : '/'}${event.bannerImage}`)
        : `${origin}/favicon.png`
    };

    res.send(injectMetadata(html, metadata));

    // Log for debugging
    try {
      fs.appendFileSync(path.join(__dirname, '../meta-debug.log'), `[${new Date().toISOString()}] Event: ${link} -> ${metadata.title}\n`);
    } catch (err) { }
  } catch (error) {
    console.error('Meta injection error:', error);
    res.status(500).send('Server Error');
  }
});



// Catch-all route to serve index.html for client-side routing
app.use((req, res, next) => {
  // Do not hijack API routes or static files
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.includes('.')) {
    return next();
  }

  const html = getIndexHtml();
  if (html) {
    let origin = req.protocol + '://' + req.get('host');
    if (!origin.includes('localhost')) origin = origin.replace('http://', 'https://');

    const metadata = {
      title: "Dream CRM - Streamline Your Business",
      description: "Manage leads, students, events, and more with our comprehensive CRM solution.",
      url: `${origin}${req.originalUrl}`,
      image: `${origin}/favicon.png`
    };

    return res.send(injectMetadata(html, metadata));
  }

  // Dev / fallback case
  res.status(404).json({
    message: 'Resource not found',
    env: process.env.NODE_ENV,
    hint: 'If you are in development, access frontend via dev server.'
  });
});

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});