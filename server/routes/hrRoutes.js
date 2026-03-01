import express from 'express';
import { hrController } from '../controller/hrController.js';

const router = express.Router();

// HR Dashboard Stats & Activity
router.get('/stats', hrController.getStats);
router.get('/activity', hrController.getRecentActivity);

// Employee Management
router.get('/employees', hrController.getEmployees);

// Job Posting Management
router.get('/jobs', hrController.getJobs);
router.get('/applications', hrController.getAllApplications);
router.get('/jobs/:id', hrController.getJob);
router.get('/jobs/:id/applications', hrController.getJobApplications);
router.post('/jobs', hrController.createJob);
router.put('/jobs/:id', hrController.updateJob);
router.delete('/jobs/:id', hrController.deleteJob);
router.patch('/applications/:id/status', hrController.updateApplicationStatus);

// Public Job Routes (No auth required for these)
router.get('/public/jobs', hrController.getPublicJobs);
router.get('/public/jobs/:id', hrController.getPublicJob);
router.post('/jobs/apply', hrController.applyForJob);

export default router;
