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
    console.log(`[REQ] ${req.method} ${req.path} | UA: ${req.headers['user-agent']}`);
  }
  next();
});

// Debug route to verify bot detection (Moved to top)
app.get('/api/debug-bot', (req, res) => {
  res.json({
    bot: isCrawler(req),
    ua: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ping', (req, res) => res.json({ message: 'pong', timestamp: new Date().toISOString() }));

// ================= HELPERS (MOVE TO TOP FOR USE IN MIDDLEWARE) =================

// WhatsApp / Facebook / Other share bots detection
const isCrawler = (req) => {
  const ua = req.headers['user-agent'] || ''
  const bots = [
    'facebookexternalhit', 'Facebot', 'facebookcatalog', 'facebookplatform',
    'WhatsApp', 'Twitterbot', 'LinkedInBot', 'TelegramBot', 'Skeletonbot', 'Slackbot',
    'discordbot', 'redditbot', 'Googlebot', 'Bingbot', 'AdsBot-Google',
    'Pinterestbot', 'Pinterest/0.1', 'SkypeShell'
  ]
  return bots.some(bot => ua.toLowerCase().includes(bot.toLowerCase()))
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
 * Replaces existing common tags to avoid duplicates.
 */
const injectMetadata = (html, meta) => {
  // Escape potential double quotes in content
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
    // Aggressively remove existing tags that crawlers might pick up
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta name="description"[\s\S]*?>/gi, '')
    .replace(/<meta property="og:[^>]*?>/gi, '')
    .replace(/<meta name="og:[^>]*?>/gi, '')
    .replace(/<meta name="twitter:[^>]*?>/gi, '')
    // Inject new tags at the top of head for maximum visibility
    // Use regex for head to handle attributes if any
    .replace(/<head[^>]*>/i, (match) => `${match}\n${tags}`)
}

// ================= BOT / CRAWLER HANDLING (GLOBAL PRIORITY) =================

app.use(async (req, res, next) => {
  // 1. Skip if it's not a crawler
  if (!isCrawler(req)) return next()

  // 2. Skip if it's a direct resource request
  if (req.path.includes('.') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next()
  }

  let origin = req.protocol + '://' + req.get('host')
  // Force HTTPS on production-like environments if not already
  if (!origin.includes('localhost') && !origin.startsWith('https://')) {
    origin = origin.replace('http://', 'https://')
  }

  // Default metadata
  let metadata = {
    title: 'Dream CRM',
    description: 'Manage leads, students, events, and more with our comprehensive CRM solution.',
    url: `${origin}${req.originalUrl}`,
    image: `${origin}/icon-512.png`, // Use larger icon for social sharing
    width: 512,
    height: 512
  }

  // 3. Special handling for Event Registration
  // Check if current path contains exactly one 32-char hex string
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
  console.log(`[BOT] Detected Crawler: ${req.headers['user-agent']} for ${req.path}`);
  const html = injectMetadata(getIndexHtml(), metadata)

  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .set('X-Bot-Type', 'Crawler')
    .set('X-Event-Link', registrationLink || 'none')
    .send(html)
});

// ================= PATH SETUP =================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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



// ================= SPA FALLBACK & CRAWLER SUPPORT =================

app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/uploads/') ||
    req.path.includes('.')
  ) return next()

  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

// ================= SERVER =================

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
