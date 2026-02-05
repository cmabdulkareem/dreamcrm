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

import { getBaseUploadDir } from './utils/uploadHelper.js';

// ================= HELPERS (AT THE VERY TOP) =================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// WhatsApp / Facebook / Other share bots detection
const isCrawler = (req) => {
  const ua = req.headers['user-agent'] || ''
  const bots = [
    'facebookexternalhit', 'Facebot', 'facebookcatalog', 'facebookplatform',
    'WhatsApp', 'Twitterbot', 'LinkedInBot', 'TelegramBot', 'Slackbot',
    'discordbot', 'redditbot', 'Googlebot', 'Bingbot', 'AdsBot-Google',
    'Pinterestbot', 'Pinterest/0.1', 'SkypeShell'
  ]
  const match = bots.some(bot => ua.toLowerCase().includes(bot.toLowerCase()))
  if (match) console.log(`[BOT-CHECK] Match found for UA: ${ua}`);
  return match
}

// Always read fresh HTML
const getIndexHtml = () => {
  const distPath = path.join(__dirname, '../dist/index.html')
  const rootPath = path.join(__dirname, '../index.html')
  const indexPath = fs.existsSync(distPath) ? distPath : rootPath
  return fs.readFileSync(indexPath, 'utf8')
}

/**
 * Injects metadata into HTML. 
 */
const injectMetadata = (html, meta) => {
  const esc = (str) => String(str || '').replace(/"/g, '&quot;')
  const title = esc(meta.title)
  const description = esc(meta.description)
  const image = esc(meta.image)
  const url = esc(meta.url)
  const width = meta.width || 1200
  const height = meta.height || 630

  const tags = `
  <!-- INJECTED META -->
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="${width}" />
  <meta property="og:image:height" content="${height}" />
  <meta property="og:image:alt" content="${title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  `

  return html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta name="description"[\s\S]*?>/gi, '')
    .replace(/<meta property="og:[^>]*?>/gi, '')
    .replace(/<meta name="og:[^>]*?>/gi, '')
    .replace(/<meta name="twitter:[^>]*?>/gi, '')
    .replace(/<head[^>]*>/i, (match) => `${match}\n${tags}`)
}

const app = express()
app.set('trust proxy', 1)

// ================= MIDDLEWARE =================
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors(corsOptions))
app.use(compression())

// Global Logger (Temporary for debugging)
app.use((req, res, next) => {
  if (!req.path.startsWith('/uploads/') && !req.path.includes('.')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[REQ] ${req.method} ${req.path} | Status: ${res.statusCode} | Time: ${duration}ms | UA: ${req.headers['user-agent']}`);
    });
  }
  next();
});

// ================= DIAGNOSTICS (ABSOLUTE PRIORITY) =================

app.get('/api/ping', (req, res) => {
  console.log('[DIAG] /api/ping hit');
  res.json({ message: 'pong api', timestamp: new Date().toISOString() });
});

app.get('/ping', (req, res) => {
  console.log('[DIAG] /ping hit');
  res.json({ message: 'pong root', timestamp: new Date().toISOString() });
});

app.get('/test-server', (req, res) => {
  console.log('[DIAG] /test-server hit');
  res.send('Server is UP');
});

app.get('/api/debug-bot', (req, res) => {
  console.log('[DIAG] /api/debug-bot hit');
  res.json({
    bot: isCrawler(req),
    ua: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
});

// ================= BOT / CRAWLER HANDLING =================

app.use(async (req, res, next) => {
  // 1. Skip if it's not a crawler
  if (!isCrawler(req)) return next()

  // 2. Skip if it's a direct resource request
  if (req.path.includes('.') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next()
  }

  let origin = req.protocol + '://' + req.get('host')
  if (!origin.includes('localhost') && !origin.startsWith('https://')) {
    origin = origin.replace('http://', 'https://')
  }

  // Default metadata
  let metadata = {
    title: 'Dream CRM',
    description: 'Manage leads, students, events, and more with our comprehensive CRM solution.',
    url: `${origin}${req.originalUrl}`,
    image: `${origin}/icon-512.png`,
    width: 512,
    height: 512
  }

  // 3. Special handling for Event Registration
  const hexMatches = req.path.match(/[0-9a-f]{32}/i)
  const registrationLink = hexMatches ? hexMatches[0] : null

  if (registrationLink) {
    try {
      const event = await Event.findOne({ registrationLink }).lean()
      if (event) {
        metadata.title = `${event.eventName} | Dream CRM`
        metadata.description = (event.eventDescription || 'Join our event!').substring(0, 200)
        metadata.width = 1280
        metadata.height = 720

        if (event.bannerImage) {
          metadata.image = event.bannerImage.startsWith('http')
            ? event.bannerImage
            : `${origin}${event.bannerImage.startsWith('/') ? '' : '/'}${event.bannerImage}`
        }
      }
    } catch (err) {
      console.error('[BOT] DB Error:', err)
    }
  }

  // 4. Inject and send
  console.log(`[BOT] Detected Crawler for ${req.path}. Injected metadata:`, metadata.title);
  const html = injectMetadata(getIndexHtml(), metadata)

  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .set('X-Bot-Type', 'Crawler')
    .set('X-Event-Link', registrationLink || 'none')
    .send(html)
});

// ================= PATH SETUP =================

// Static files
app.use('/uploads', express.static(getBaseUploadDir()))
app.use(express.static(path.join(__dirname, '../dist')))
app.use(express.static(path.join(__dirname, '../public')))

// ================= API ROUTES =================
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
app.use('/api/student-portal', studentPortalRoutes)

// ================= SPA FALLBACK & 404 =================

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[404] API Not Found: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ error: 'API route not found', path: req.originalUrl });
  }

  if (req.path.startsWith('/uploads/') || req.path.includes('.')) {
    return next()
  }

  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// ================= SERVER =================

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
