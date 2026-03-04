import express from 'express';
import { hrController } from '../controller/hrController.js';
import verifyToken from '../middleware/verifyToken.js';

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
router.post('/jobs', verifyToken, hrController.createJob);
router.put('/jobs/:id', verifyToken, hrController.updateJob);
router.delete('/jobs/:id', verifyToken, hrController.deleteJob);
router.patch('/applications/:id/status', verifyToken, hrController.updateApplicationStatus);
router.patch('/applications/:id/schedule', verifyToken, hrController.scheduleInterview);
router.delete('/applications/:id', verifyToken, hrController.deleteApplication);
router.post('/jobs/:id/candidates', verifyToken, hrController.addManualCandidate);

// Agreement Template Management
router.get('/agreements', verifyToken, hrController.getAgreementTemplates);
router.post('/agreements', verifyToken, hrController.createAgreementTemplate);
router.put('/agreements/:id', verifyToken, hrController.updateAgreementTemplate);
router.delete('/agreements/:id', verifyToken, hrController.deleteAgreementTemplate);

// Public Job & Onboarding Routes (No auth required for these)
router.get('/public/jobs', hrController.getPublicJobs);
router.get('/public/jobs/:id', hrController.getPublicJob);
router.post('/jobs/apply', hrController.applyForJob);

// Public Onboarding
router.get('/public/onboarding/:token', hrController.getOnboardingAgreement);
router.post('/public/onboarding/:token/sign', hrController.signOnboardingAgreement);
router.get('/public/agreement/download', hrController.downloadSignedAgreementPdf);

// HR PDF Download (Protected)
router.get('/agreement/download', hrController.downloadSignedAgreementPdf);

// Verification
router.get('/agreement/verify/:id', hrController.verifyAgreementSignature);

export default router;
