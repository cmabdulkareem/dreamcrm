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

// WhatsApp / Facebook crawler detection
const isCrawler = (req) => {
  const ua = req.headers['user-agent'] || ''
  return /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot/i.test(ua)
}

// Always read fresh HTML (NO cache for crawlers)
const getIndexHtml = () => {
  const distPath = path.join(__dirname, '../dist/index.html')
  const rootPath = path.join(__dirname, '../index.html')
  const indexPath = fs.existsSync(distPath) ? distPath : rootPath
  return fs.readFileSync(indexPath, 'utf8')
}

const injectMetadata = (html, meta) => {
  const tags = `
<title>${meta.title}</title>
<meta name="description" content="${meta.description}" />

<meta property="og:type" content="website" />
<meta property="og:url" content="${meta.url}" />
<meta property="og:title" content="${meta.title}" />
<meta property="og:description" content="${meta.description}" />
<meta property="og:image" content="${meta.image}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${meta.title}" />
<meta name="twitter:description" content="${meta.description}" />
<meta name="twitter:image" content="${meta.image}" />
`

  return html
    .replace(/<title>.*?<\/title>/gi, '')
    .replace(/<meta name="description".*?>/gi, '')
    .replace(/<meta property="og:.*?>/gi, '')
    .replace(/<meta name="twitter:.*?>/gi, '')
    .replace('</head>', `${tags}</head>`)
}

// ================= SHARE ROUTE (FIXED) =================

app.get('/event-registration/:link', async (req, res) => {
  try {
    const event = await Event.findOne({
      registrationLink: req.params.link,
      isActive: true
    }).lean()

    let origin = req.protocol + '://' + req.get('host')
    if (!origin.includes('localhost')) origin = origin.replace('http://', 'https://')

    const metadata = {
      title: event ? `${event.eventName} | Dream CRM` : 'Dream CRM',
      description: event?.eventDescription || 'Register for this event',
      url: `${origin}${req.originalUrl}`,
      image: event?.bannerImage
        ? (event.bannerImage.startsWith('http')
            ? event.bannerImage
            : `${origin}${event.bannerImage}`)
        : `${origin}/favicon.png`
    }

    // 🔥 CRAWLER → SSR META
    if (isCrawler(req)) {
      const html = injectMetadata(getIndexHtml(), metadata)
      return res
        .status(200)
        .set('Cache-Control', 'no-store')
        .send(html)
    }

    // 👤 USER → SPA
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  } catch (err) {
    console.error('Meta error:', err)
    res.status(500).send('Server Error')
  }
})

// ================= SPA FALLBACK =================

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
