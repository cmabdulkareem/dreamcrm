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

import { getBaseUploadDir } from './utils/uploadHelper.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.set('trust proxy', 1)

// ================= MIDDLEWARE =================
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors(corsOptions))
app.use(compression())

// ================= PATH SETUP =================

// Static files
app.get('/uploads/backups/:filename', (req, res) => {
  const filePath = path.join(getBaseUploadDir(), 'backups', req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  }
  res.status(404).send('Backup file not found');
});

app.use('/uploads/backups', express.static(path.join(getBaseUploadDir(), 'backups'), {
  setHeaders: (res) => {
    res.set('Content-Disposition', 'attachment');
  }
}))
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

// ================= SPA FALLBACK =================

app.use((req, res, next) => {
  const isApiOrUpload = req.url.startsWith('/api/') || req.url.startsWith('/uploads/');
  const hasExtension = req.url.split('?')[0].includes('.');

  if (isApiOrUpload || hasExtension) {
    return next();
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
