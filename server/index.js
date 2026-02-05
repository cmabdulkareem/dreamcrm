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

// ================= HELPERS =================

// WhatsApp / Facebook / Other share bots detection
const isCrawler = (req) => {
  const ua = req.headers['user-agent'] || ''
  const bots = [
    'facebookexternalhit', 'Facebot', 'WhatsApp', 'Twitterbot', 'LinkedInBot',
    'TelegramBot', 'Slackbot', 'discordbot', 'redditbot', 'Googlebot', 'Bingbot'
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

  const tags = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  `

  return html
    // Remove existing meta tags that we are about to inject
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta name="description"[\s\S]*?>/gi, '')
    .replace(/<meta property="og:[^>]*?>/gi, '')
    .replace(/<meta name="twitter:[^>]*?>/gi, '')
    // Inject new tags before </head>
    .replace('</head>', `${tags}\n</head>`)
}

// ================= BOT / CRAWLER HANDLING (PRIORITY) =================

app.use(async (req, res, next) => {
  // 1. Skip if it's not a crawler
  if (!isCrawler(req)) return next()

  // 2. Skip if it's a direct resource request
  if (req.path.includes('.') || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next()
  }

  console.log(`\n[BOT-DEBUG] ----------------------------------------`)
  console.log(`[BOT-DEBUG] Detected crawler: ${req.headers['user-agent']}`)
  console.log(`[BOT-DEBUG] Request Path: ${req.path}`)

  let origin = req.protocol + '://' + req.get('host')
  if (!origin.includes('localhost')) origin = origin.replace('http://', 'https://')
  console.log(`[BOT-DEBUG] Computed Origin: ${origin}`)

  // Default metadata
  let metadata = {
    title: 'Dream CRM',
    description: 'Manage leads, students, events, and more with our comprehensive CRM solution.',
    url: `${origin}${req.originalUrl}`,
    image: `${origin}/favicon.png`
  }

  // 3. Special handling for Event Registration
  // Match /event-registration/ or /event%20registration/
  const eventPathMatch = req.path.match(/\/event[- %20]registration\/([^/?]+)/i)

  if (eventPathMatch) {
    const link = eventPathMatch[1]
    console.log(`[BOT-DEBUG] Match found! Extracted link: ${link}`)
    try {
      // Find event (even if inactive, so we can show proper metadata if someone shares it)
      const event = await Event.findOne({ registrationLink: link }).lean()
      if (event) {
        console.log(`[BOT-DEBUG] Found event in DB: ${event.eventName}`)
        metadata.title = `${event.eventName} | Dream CRM`
        metadata.description = event.eventDescription || 'Register for this event'
        if (event.bannerImage) {
          metadata.image = event.bannerImage.startsWith('http')
            ? event.bannerImage
            : `${origin}${event.bannerImage}`
        }
      } else {
        console.log(`[BOT-DEBUG] Event NOT FOUND in DB for link: ${link}`)
      }
    } catch (err) {
      console.error('[BOT-DEBUG] DB Error searching event:', err)
    }
  } else {
    console.log(`[BOT-DEBUG] No event path match for: ${req.path}`)
  }

  // 4. Inject and send
  console.log(`[BOT-DEBUG] Serving Meta: Title="${metadata.title}" Image="${metadata.image}"`)
  const html = injectMetadata(getIndexHtml(), metadata)
  console.log(`[BOT-DEBUG] ----------------------------------------\n`)

  return res
    .status(200)
    .set('Cache-Control', 'no-store')
    .send(html)
})

// Routes will be handled by catch-all or specific bot logic above

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
