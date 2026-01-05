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
import chatRoutes from './routes/chatRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import leaveRoutes from './routes/leaveRoutes.js'
import announcementRoutes from './routes/announcementRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import courseCategoryRoutes from './routes/courseCategoryRoute.js'
import monthlyTargetRoutes from './routes/monthlyTargetRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import batchRoutes from './routes/batchRoutes.js'
import callListRoutes from './routes/callListRoutes.js'

const app = express()

// Trust proxy is required for Render/Heroku to correctly detect protocol (http vs https)
app.set('trust proxy', 1);

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from dist directory (built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve static files from public directory (images, favicon, etc.)
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
// ...
app.use(compression())
app.use(cors(corsOptions))

app.use('/api/users', routes)
app.use('/api/customers', customerRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/course-categories', courseCategoryRoutes)
app.use('/api/contact-points', contactPointRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/monthly-targets', monthlyTargetRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/batches', batchRoutes)
app.use('/api/call-lists', callListRoutes)



// Catch-all route to serve index.html for client-side routing
app.use((req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).send('Not Found');
    return;
  }

  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If dist/index.html doesn't exist, we might be in dev mode
    res.status(404).json({
      message: 'Resource not found',
      env: process.env.NODE_ENV,
      hint: 'If you are in development, make sure you are accessing the frontend via the dev server (usually port 5173).'
    });
  }
});

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});