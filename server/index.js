import express from 'express'
process.env.TZ = 'Asia/Kolkata';
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
import eventModel from './model/eventModel.js'
import jobModel from './model/jobModel.js'
import Batch from './model/batchModel.js'
import BatchStudent from './model/batchStudentModel.js'
import Attendance from './model/attendanceModel.js'
import Holiday from './model/holidayModel.js'
import { generateSEOHtml } from './utils/seoHelper.js'
import routes from './routes/userRoutes.js'
import setupSocket, { emitNotification } from './realtime/socket.js'
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
import labRoutes from "./routes/labRoutes.js";
import promotionalRoutes from "./routes/promotionalRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import marketingTaskRoutes from './routes/marketingTaskRoutes.js';

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
app.use('/api/compute-lab', labRoutes)
app.use('/api/promotional', promotionalRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/marketing/tasks', marketingTaskRoutes)


// ================= SPA FALLBACK =================

app.use(async (req, res, next) => {
  const isApiOrUpload = req.url.startsWith('/api/') || req.url.startsWith('/uploads/');
  const hasExtension = req.url.split('?')[0].includes('.');

  if (isApiOrUpload || hasExtension) {
    return next();
  }

  // Check if it's an event registration route for SEO
  const eventMatch = req.url.match(/^\/event-registration\/([a-f0-9]+)(\/|\?|$)/);
  if (eventMatch) {
    try {
      const link = eventMatch[1];
      const event = await eventModel.findOne({ registrationLink: link, isActive: true });
      if (event) {
        let indexPath = path.join(__dirname, '../dist/index.html');
        let isDev = false;
        if (!fs.existsSync(indexPath)) {
          indexPath = path.join(__dirname, '../index.html');
          isDev = true;
        }

        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          html = generateSEOHtml(html, event, 'event', isDev);
          return res.send(html);
        }
      }
    } catch (error) {
      console.error('SEO Injection Error (Event):', error);
    }
  }

  // Check if it's a job application route for SEO
  const jobMatch = req.url.match(/^\/jobs\/apply\/([a-f0-9]{24})(\/|\?|$)/);
  if (jobMatch) {
    try {
      const id = jobMatch[1];
      const job = await jobModel.findById(id);
      if (job && job.status === 'Active') {
        let indexPath = path.join(__dirname, '../dist/index.html');
        let isDev = false;
        if (!fs.existsSync(indexPath)) {
          indexPath = path.join(__dirname, '../index.html');
          isDev = true;
        }
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          html = generateSEOHtml(html, job, 'job', isDev);
          return res.send(html);
        }
      }
    } catch (error) {
      console.error('SEO Injection Error (Job):', error);
    }
  }

  // Check if it's a public attendance route for SEO
  const attendanceMatch = req.url.match(/^\/public\/attendance\/([a-z0-9]+)(\/|\?|$)/);
  if (attendanceMatch) {
    try {
      const shareToken = attendanceMatch[1];
      const batch = await Batch.findOne({ shareToken });
      if (batch) {
        const students = await BatchStudent.find({ batchId: batch._id }).sort({ studentName: 1 });
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        const startDate = new Date(y, m, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(y, m + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const [attendance, holidays] = await Promise.all([
          Attendance.find({ batchId: batch._id, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
          Holiday.find({ brand: batch.brand, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 })
        ]);

        const data = {
          batch: { batchName: batch.batchName, subject: batch.subject, instructorName: batch.instructorName },
          students,
          attendance,
          holidays
        };

        let indexPath = path.join(__dirname, '../dist/index.html');
        let isDev = false;
        if (!fs.existsSync(indexPath)) {
          indexPath = path.join(__dirname, '../index.html');
          isDev = true;
        }
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          html = generateSEOHtml(html, data, 'attendance', isDev);
          return res.send(html);
        }
      }
    } catch (error) {
      console.error('SEO Injection Error (Attendance):', error);
    }
  }

  // Check if it's an onboarding route for SEO
  const onboardingMatch = req.url.match(/^\/onboarding\/([a-f0-9]{64})(\/|\?|$)/);
  if (onboardingMatch) {
    try {
      const token = onboardingMatch[1];
      const job = await jobModel.findOne({ "applications.onboardingToken": token }).populate('applications.agreementTemplates');
      if (job) {
        const application = job.applications.find(app => app.onboardingToken === token);
        if (application && !application.agreementSigned) {
          const data = {
            fullName: application.fullName,
            jobTitle: job.title,
            templates: application.agreementTemplates 
          };

          let indexPath = path.join(__dirname, '../dist/index.html');
          let isDev = false;
          if (!fs.existsSync(indexPath)) {
            indexPath = path.join(__dirname, '../index.html');
            isDev = true;
          }
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf8');
            html = generateSEOHtml(html, data, 'onboarding', isDev);
            return res.send(html);
          }
        }
      }
    } catch (error) {
      console.error('SEO Injection Error (Onboarding):', error);
    }
  }

  // Check if it's an agreement verification route for SEO
  const verifyMatch = req.url.match(/^\/agreement\/verify\/([a-f0-9]+)(\/|\?|$)/);
  if (verifyMatch) {
    try {
      const id = verifyMatch[1];
      const job = await jobModel.findOne({
        $or: [{ "applications._id": id }, { "applications.onboardingToken": id }]
      });
      if (job) {
        const application = job.applications.id(id) || job.applications.find(app => app.onboardingToken === id);
        if (application && application.agreementSigned) {
          const data = {
            valid: true,
            issuedTo: application.fullName,
            jobTitle: job.title
          };

          let indexPath = path.join(__dirname, '../dist/index.html');
          let isDev = false;
          if (!fs.existsSync(indexPath)) {
            indexPath = path.join(__dirname, '../index.html');
            isDev = true;
          }
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf8');
            html = generateSEOHtml(html, data, 'agreement', isDev);
            return res.send(html);
          }
        }
      }
    } catch (error) {
      console.error('SEO Injection Error (Verification):', error);
    }
  }

  const distPath = path.join(__dirname, '../dist/index.html');
  const rootPath = path.join(__dirname, '../index.html');
  
  if (fs.existsSync(distPath)) {
    res.sendFile(distPath);
  } else if (fs.existsSync(rootPath)) {
    let html = fs.readFileSync(rootPath, 'utf8');
    html = generateSEOHtml(html, null, 'event', true); 
    res.send(html);
  } else {
    next();
  }
})

// ================= SERVER =================

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

setupSocket(server)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
