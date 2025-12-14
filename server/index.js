import express from 'express'
import compression from 'compression'
import http from 'http'
import { config } from 'dotenv'
import cors from 'cors'
import corsOptions from './config/corsOptions.js'
import cookieParser from 'cookie-parser'
import path from 'path'
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

const app = express()

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from dist directory (built React app)
app.use(express.static(path.join(__dirname, '../dist')));

// Serve static files from public directory (images, favicon, etc.)
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
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

// Health check endpoint for self-ping
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route to serve index.html for client-side routing
app.use((req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).send('Not Found');
    return;
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

// Initialize Socket.IO
setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Self-ping to prevent Render.com free tier from sleeping
  // Ping at random intervals between 10-14 minutes (Render free tier sleeps after 15 minutes)
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const MIN_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
    const MAX_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

    const schedulePing = () => {
      // Generate random interval between MIN and MAX
      const randomInterval = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
      const minutesUntilPing = (randomInterval / 60000).toFixed(1);

      setTimeout(async () => {
        try {
          const url = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
          const response = await fetch(url);
          console.log(`Self-ping successful at ${new Date().toISOString()}: ${response.status}`);
        } catch (error) {
          console.error('Self-ping failed:', error.message);
        }

        // Schedule next ping
        schedulePing();
      }, randomInterval);

      console.log(`Next self-ping scheduled in ${minutesUntilPing} minutes`);
    };

    // Start the ping cycle
    schedulePing();
    console.log('Self-ping mechanism activated (random intervals: 10-14 minutes)');
  }
});