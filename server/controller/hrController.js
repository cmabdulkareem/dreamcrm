import Job from '../model/jobModel.js';
import User from '../model/userModel.js';
import Leave from '../model/leaveModel.js';
import AgreementTemplate from '../model/agreementTemplateModel.js';
import emailService from '../utils/emailService.js';
import { generatePdfFromHtml } from "../utils/pdfGenerator.js";
import QRCode from 'qrcode';
import crypto from 'crypto';
import { getFrontendUrl } from '../utils/urlHelper.js';
import fs from 'fs';
import path from 'path';

export const hrController = {
    // Stats
    getStats: async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const jobs = await Job.find();

            const [total, active, pending, suspended, deactivated, openPositions, onLeaveToday] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ accountStatus: 'Active' }),
                User.countDocuments({ accountStatus: 'Pending' }),
                User.countDocuments({ accountStatus: 'Suspended' }),
                User.countDocuments({ accountStatus: 'Deactivated' }),
                Job.countDocuments({ status: 'Active' }),
                Leave.countDocuments({
                    status: 'approved',
                    startDate: { $lte: today },
                    endDate: { $gte: today }
                })
            ]);

            // Aggregate interview and application stats from all jobs
            let interviewsToday = 0;
            jobs.forEach(job => {
                if (job.applications) {
                    interviewsToday += job.applications.filter(app =>
                        app.interviewDate &&
                        new Date(app.interviewDate) >= today &&
                        new Date(app.interviewDate) < tomorrow
                    ).length;
                }
            });

            res.json({
                totalEmployees: total,
                activeEmployees: active,
                pendingEmployees: pending,
                suspendedEmployees: suspended,
                deactivatedEmployees: deactivated,
                openPositions,
                onLeaveToday,
                interviewsToday
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getRecentActivity: async (req, res) => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.setDate() - 2);

            const [jobs, recentJoines] = await Promise.all([
                Job.find().select('title applications'),
                User.find({ createdAt: { $gte: sevenDaysAgo } })
                    .select('fullName createdAt designation')
                    .limit(10)
                    .sort({ createdAt: -1 })
            ]);

            // Process applications from jobs
            const allApplications = [];
            const allStatusUpdates = [];

            jobs.forEach(job => {
                if (job.applications) {
                    job.applications.forEach(app => {
                        if (app.appliedDate >= sevenDaysAgo) {
                            allApplications.push({
                                ...app.toObject(),
                                jobId: { _id: job._id, title: job.title }
                            });
                        }
                        if (app.history) {
                            app.history.forEach((h, idx) => {
                                if (h.updatedOn >= twoDaysAgo && h.status !== 'Pending') {
                                    allStatusUpdates.push({
                                        fullName: app.fullName,
                                        appId: app._id,
                                        jobId: { _id: job._id, title: job.title },
                                        status: h.status,
                                        time: h.updatedOn,
                                        historyIdx: idx
                                    });
                                }
                            });
                        }
                    });
                }
            });

            const activity = [
                ...allApplications
                    .sort((a, b) => b.appliedDate - a.appliedDate)
                    .slice(0, 10)
                    .map(app => ({
                        id: `app - ${app._id} `,
                        type: 'application',
                        title: 'New Application',
                        description: `${app.fullName} applied for ${app.jobId?.title || 'a position'}`,
                        time: app.appliedDate
                    })),
                ...recentJoines.map(user => ({
                    id: `user - ${user._id} `,
                    type: 'hire',
                    title: 'New Employee',
                    description: `${user.fullName} joined as ${user.designation || 'Staff'} `,
                    time: user.createdAt
                })),
                ...allStatusUpdates.map(update => ({
                    id: `upd - ${update.appId} -${update.historyIdx} `,
                    type: 'status',
                    title: 'Status Updated',
                    description: `${update.fullName} 's application moved to ${update.status}`,
                    time: update.time
                }))
            ]
                .filter((item, index, self) =>
                    index === self.findIndex((t) => t.id === item.id) // Uniqueness check
                )
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 15); // Show latest 15 total

            res.json(activity);
        } catch (error) {
            console.error('Activity Feed Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Jobs
    getJobs: async (req, res) => {
        try {
            const jobs = await Job.find()
                .populate({ path: 'postedBy', select: 'fullName', model: 'User' })
                .sort({ postedDate: -1 });

            res.json(jobs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getJob: async (req, res) => {
        try {
            const job = await Job.findById(req.params.id).populate('postedBy', 'fullName');
            if (!job) return res.status(404).json({ message: 'Job not found' });
            res.json(job);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    createJob: async (req, res) => {
        try {
            const newJob = new Job({
                ...req.body,
                postedBy: req.user?.id || null
            });
            const savedJob = await newJob.save();
            res.status(201).json(savedJob);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    updateJob: async (req, res) => {
        try {
            const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
                .populate({ path: 'postedBy', select: 'fullName', model: 'User' });
            if (!updatedJob) return res.status(404).json({ message: 'Job not found' });
            res.json(updatedJob);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteJob: async (req, res) => {
        try {
            const job = await Job.findByIdAndDelete(req.params.id);
            if (!job) return res.status(404).json({ message: 'Job not found' });
            res.json({ message: 'Job deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Employees
    getEmployees: async (req, res) => {
        try {
            const employees = await User.find({ brands: { $exists: true, $not: { $size: 0 } } })
                .select('fullName email department designation joiningDate accountStatus');

            // Map to frontend expected format
            const formattedEmployees = employees.map(emp => ({
                id: emp._id,
                name: emp.fullName,
                role: emp.designation,
                email: emp.email,
                joinDate: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A',
                status: emp.accountStatus === 'Active' ? 'Active' : 'On Leave' // Simple mapping for now
            }));

            res.json(formattedEmployees);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Public Job Methods
    getPublicJobs: async (req, res) => {
        try {
            const jobs = await Job.find({ status: 'Active' }).sort({ postedDate: -1 });
            res.json(jobs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPublicJob: async (req, res) => {
        try {
            const job = await Job.findById(req.params.id);
            if (!job || job.status !== 'Active') {
                return res.status(404).json({ message: 'Job not found or no longer active' });
            }
            res.json(job);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    applyForJob: async (req, res) => {
        try {
            const { jobId, fullName, email, phone, resumeUrl, coverLetter } = req.body;

            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }

            const application = {
                fullName,
                email,
                phone,
                resumeUrl,
                coverLetter,
                source: 'Online',
                history: [{
                    status: 'Pending',
                    remark: 'Entry Created'
                }]
            };

            job.applications.push(application);
            await job.save();

            res.status(201).json({ message: 'Application submitted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    addManualCandidate: async (req, res) => {
        try {
            const { id } = req.params; // jobId
            const { fullName, email, phone, resumeUrl, coverLetter } = req.body;
            const userId = req.user?.id;

            const job = await Job.findById(id);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }

            const application = {
                fullName,
                email,
                phone,
                resumeUrl,
                coverLetter,
                source: 'Manual',
                history: [{
                    status: 'Pending',
                    remark: 'Manually added by HR',
                    updatedBy: userId
                }]
            };

            job.applications.push(application);
            await job.save();

            // Return the newly created application (last one in the array)
            const newApp = job.applications[job.applications.length - 1];
            res.status(201).json(newApp);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getJobApplications: async (req, res) => {
        try {
            const { id } = req.params;
            const job = await Job.findById(id).select('applications');
            if (!job) return res.status(404).json({ message: 'Job not found' });

            // Sort by appliedDate descending
            const sortedApps = (job.applications || []).sort((a, b) => b.appliedDate - a.appliedDate);
            res.json(sortedApps);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllApplications: async (req, res) => {
        try {
            const jobs = await Job.find().populate('applications.history.updatedBy', 'fullName');

            const allApplications = [];
            jobs.forEach(job => {
                if (job.applications) {
                    job.applications.forEach(app => {
                        allApplications.push({
                            ...app.toObject(),
                            jobId: {
                                _id: job._id,
                                title: job.title,
                                brand: job.brand,
                                department: job.department
                            }
                        });
                    });
                }
            });

            allApplications.sort((a, b) => b.appliedDate - a.appliedDate);
            res.json(allApplications);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteApplication: async (req, res) => {
        try {
            const { id } = req.params; // application _id
            const job = await Job.findOne({ 'applications._id': id });
            if (!job) return res.status(404).json({ message: 'Application not found' });

            job.applications.pull({ _id: id });
            await job.save();

            res.json({ message: 'Application deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateApplicationStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, remark, clearInterview, templateIds } = req.body;
            const userId = req.user?.id;

            const job = await Job.findOne({ "applications._id": id });
            if (!job) return res.status(404).json({ message: 'Application or Job not found' });

            const application = job.applications.id(id);
            const oldStatus = application.status;
            application.status = status;

            // Clear interview data if requested or moving away from Interviewed status
            if (clearInterview || (oldStatus === 'Interviewed' && status !== 'Interviewed')) {
                application.interviewDate = null;
                application.interviewTime = null;
            }

            application.history.push({
                status,
                remark: remark || `Status updated from ${oldStatus} to ${status}${clearInterview ? ' (Interview cancelled)' : ''}`,
                updatedBy: userId,
                updatedOn: new Date()
            });

            await job.save();

            // Handle automation for "Hired" (Offer) stage
            if (status === 'Hired' && oldStatus !== 'Hired') {
                console.log(`🚀 Triggering onboarding for ${application.fullName} (${application.email})`);
                application.onboardingToken = crypto.randomBytes(32).toString('hex');

                if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
                    application.agreementTemplates = templateIds;
                } else if (templateIds && !Array.isArray(templateIds)) {
                    // Fallback for single ID string
                    application.agreementTemplates = [templateIds];
                } else {
                    const activeTemplate = await AgreementTemplate.findOne({
                        isActive: true
                    });
                    if (activeTemplate) {
                        application.agreementTemplates = [activeTemplate._id];
                    }
                }

                await job.save();

                if (application.email) {
                    emailService.sendOnboardingInviteEmail(application, application.onboardingToken, getFrontendUrl(req));
                }
            }

            res.json(application);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    scheduleInterview: async (req, res) => {
        try {
            const { id } = req.params;
            const { interviewDate, interviewTime, remark } = req.body;
            const userId = req.user?.id;

            const job = await Job.findOne({ "applications._id": id });
            if (!job) return res.status(404).json({ message: 'Application not found' });

            const application = job.applications.id(id);

            application.interviewDate = interviewDate;
            application.interviewTime = interviewTime;
            application.status = 'Interviewed';

            application.history.push({
                status: 'Interviewed',
                remark: remark || `Interview scheduled for ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}`,
                updatedBy: userId,
                updatedOn: new Date()
            });

            await job.save();

            // Send automated email invite
            if (application.email) {
                // We pass a mock job object for the email title
                emailService.sendInterviewInviteEmail(application, { title: job.title }, remark);
            }

            res.json(application);
        } catch (error) {
            console.error('Schedule Interview Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    /* ============================================
       AGREEMENT BUILDER METHODS
    ============================================ */
    getAgreementTemplates: async (req, res) => {
        try {
            const templates = await AgreementTemplate.find()
                .sort({ createdAt: -1 });
            res.json(templates);
        } catch (error) {
            console.error('Error fetching agreement templates:', error);
            res.status(500).json({ message: error.message });
        }
    },

    createAgreementTemplate: async (req, res) => {
        try {
            const { name, sections, brandId } = req.body;
            const userId = req.user?.id;

            const template = new AgreementTemplate({
                name,
                sections,
                createdBy: userId
            });

            await template.save();
            res.status(201).json(template);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    updateAgreementTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, sections, isActive } = req.body;

            const template = await AgreementTemplate.findById(id);
            if (!template) return res.status(404).json({ message: 'Template not found' });

            if (name) template.name = name;
            if (sections) template.sections = sections;
            if (typeof isActive === 'boolean') template.isActive = isActive;

            await template.save();
            res.json(template);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteAgreementTemplate: async (req, res) => {
        try {
            const { id } = req.params;
            await AgreementTemplate.findByIdAndDelete(id);
            res.json({ message: 'Template deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    /* ============================================
       CANDIDATE ONBOARDING (PUBLIC)
    ============================================ */
    getOnboardingAgreement: async (req, res) => {
        try {
            const { token } = req.params;
            const job = await Job.findOne({ "applications.onboardingToken": token })
                .populate('applications.agreementTemplates');

            if (!job) {
                return res.status(404).json({ message: 'Onboarding link is invalid or has expired.' });
            }

            const application = job.applications.find(app => app.onboardingToken === token);

            if (application.agreementSigned) {
                return res.status(400).json({ message: 'This agreement has already been signed.' });
            }

            res.json({
                fullName: application.fullName,
                jobTitle: job.title,
                templates: application.agreementTemplates
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    signOnboardingAgreement: async (req, res) => {
        try {
            const { token } = req.params;
            const { signatureName } = req.body;

            const job = await Job.findOne({ "applications.onboardingToken": token })
                .populate('applications.agreementTemplates');

            if (!job) {
                return res.status(404).json({ message: 'Onboarding link is invalid.' });
            }

            const application = job.applications.find(app => app.onboardingToken === token);

            if (application.agreementSigned) {
                return res.status(400).json({ message: 'Agreement already signed.' });
            }

            // Snapshot the signed content from all templates
            let allSections = [];
            application.agreementTemplates.forEach(template => {
                if (template && template.sections) {
                    template.sections.forEach(s => {
                        allSections.push({
                            title: s.title,
                            content: s.content
                        });
                    });
                }
            });
            application.signedContent = allSections;

            application.agreementSigned = true;
            application.signatureName = signatureName;
            application.signedAt = new Date();
            application.signingIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            // Add to history
            application.history.push({
                status: application.status,
                remark: `Agreement signed by candidate: ${signatureName}`,
                updatedOn: new Date()
            });

            await job.save();

            res.json({ message: 'Agreement signed successfully! Welcome to the team.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getSignedAgreementPublic: async (req, res) => {
        try {
            const { token } = req.params;
            const job = await Job.findOne({ "applications.onboardingToken": token });

            if (!job) {
                return res.status(404).json({ message: 'Link is invalid or has expired.' });
            }

            const application = job.applications.find(app => app.onboardingToken === token);

            if (!application.agreementSigned) {
                return res.status(400).json({ message: 'Agreement has not been signed yet.' });
            }

            res.json({
                fullName: application.fullName,
                jobTitle: job.title,
                signedContent: application.signedContent,
                signatureName: application.signatureName,
                signedAt: application.signedAt,
                appId: application._id,
                onboardingToken: application.onboardingToken
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    downloadSignedAgreementPdf: async (req, res) => {
        try {
            const { token, appId } = req.query;
            let application, job;

            if (token) {
                job = await Job.findOne({ "applications.onboardingToken": token });
                if (job) {
                    application = job.applications.find(app => app.onboardingToken === token);
                }
            } else if (appId) {
                job = await Job.findOne({ "applications._id": appId });
                if (job) {
                    application = job.applications.id(appId);
                }
            }

            if (!application || !application.agreementSigned) {
                return res.status(404).json({ message: 'Agreement not found or not signed.' });
            }

            // Load logo
            let logoBase64 = '';
            try {
                const logoPath = path.resolve('..', 'public', 'images', 'logo', 'logo.svg');
                if (fs.existsSync(logoPath)) {
                    logoBase64 = fs.readFileSync(logoPath).toString('base64');
                }
            } catch (err) {
                console.error('Logo loading error:', err);
            }

            // Generate QR code for verification
            const verifyUrl = `${getFrontendUrl(req)}/agreement/verify/${application._id || token}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
                margin: 0,
                scale: 8,
                color: {
                    dark: '#1e3a8a',
                    light: '#ffffff'
                }
            });

            const docId = (token || appId).toUpperCase();

            // Header template for all pages
            const headerTemplate = `
                <div style="font-family: 'Inter', sans-serif; width: 100%; border-bottom: 0.5px solid #eee; margin: 0 15mm; padding: 5mm 0; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #9ca3af; -webkit-print-color-adjust: exact;">
                    <div style="text-transform: uppercase; letter-spacing: 1px;">CDC International • Agreement</div>
                    <div style="font-weight: 700;">ID: ${docId}</div>
                </div>
            `;

            // Footer template for all pages
            const footerTemplate = `
                <div style="font-family: 'Inter', sans-serif; width: 100%; border-top: 0.5px solid #eee; margin: 0 15mm; padding: 5mm 0; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #9ca3af; -webkit-print-color-adjust: exact;">
                    <div>CERTIFIED DIGITAL RECORD</div>
                    <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
                </div>
            `;

            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: A4;
                        margin: 25mm 15mm 25mm 15mm;
                    }
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        color: #1a1a1b;
                        font-size: 11pt;
                        line-height: 1.5;
                        -webkit-print-color-adjust: exact;
                    }
                    .document-wrapper {
                        width: 100%;
                        position: relative;
                    }
                    /* Watermark that repeats on every page via fixed position */
                    .watermark {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-35deg);
                        font-size: 110px;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.02); /* Slightly more visible but still subtle */
                        white-space: nowrap;
                        z-index: -1;
                        pointer-events: none;
                        text-transform: uppercase;
                        letter-spacing: 12px;
                    }
                    header {
                        text-align: center;
                        margin-bottom: 30px;
                        position: relative;
                        z-index: 1;
                    }
                    .logo-container {
                        margin-bottom: 15px;
                    }
                    .logo-container img {
                        height: 80px;
                        width: auto;
                    }
                    .doc-title {
                        font-size: 18pt;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                        margin: 0 0 8px 0;
                        color: #111;
                    }
                    .meta-info {
                        font-size: 11pt;
                        color: #4b5563;
                        max-width: 90%;
                        margin: 0 auto;
                    }
                    .meta-info strong {
                        color: #111;
                    }
                    .divider {
                        height: 0.5px;
                        background: #e5e7eb;
                        width: 100%;
                        margin: 20px 0 30px 0;
                    }
                    .section {
                        margin-top: 20px;
                        margin-bottom: 20px;
                        page-break-inside: auto; /* Allow sections to break if needed */
                    }
                    .section-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 10px;
                        break-after: avoid; /* Don't leave header alone at bottom of page */
                    }
                    .section-num {
                        font-size: 11px;
                        font-weight: 800;
                        color: #2563eb;
                        background: #eff6ff;
                        padding: 3px 6px;
                        border-radius: 3px;
                        flex-shrink: 0;
                    }
                    .section-title {
                        font-size: 14pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #111;
                        letter-spacing: 0.5px;
                        margin: 0;
                    }
                    .section-body {
                        font-size: 11pt;
                        color: #374151;
                        text-align: left;
                        line-height: 1.5;
                    }
                    .section-body h3 {
                        font-size: 13pt;
                        font-weight: 700;
                        margin: 12px 0 6px 0;
                        color: #111;
                    }
                    .section-body p {
                        margin: 0 0 8px 0;
                    }
                    .section-body ul, .section-body ol {
                        padding-left: 15px;
                        margin: 6px 0;
                    }
                    .section-body li {
                        margin-bottom: 3px;
                    }
                    .signature-area-wrapper {
                        margin-top: 40px;
                        page-break-inside: avoid; /* Keep signature block together */
                    }
                    .signature-section {
                        padding-top: 25px;
                        border-top: 1px solid #eee;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }
                    .sig-label {
                        font-size: 8px;
                        font-weight: 800;
                        color: #9ca3af;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 15px;
                    }
                    .sig-line {
                        font-family: 'Georgia', serif;
                        font-size: 20px;
                        font-style: italic;
                        color: #00085a;
                        padding: 5px 0;
                        border-bottom: 1px solid #111;
                        margin-bottom: 8px;
                        min-height: 35px;
                    }
                    .sig-details {
                        font-size: 9px;
                        color: #4b5563;
                        line-height: 1.4;
                    }
                    .verification-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 4px 8px;
                        background: #f0fdf4;
                        color: #166534;
                        border: 1px solid #bbf7d0;
                        border-radius: 4px;
                        font-size: 8px;
                        font-weight: 700;
                        margin-top: 6px;
                    }
                    .doc-id-small {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 8px;
                        color: #9ca3af;
                        margin-top: 8px;
                    }
                    footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 8px;
                        color: #9ca3af;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        padding-top: 15px;
                        border-top: 0.5px solid #f3f4f6;
                    }
                </style>
            </head>
            <body>
                <div class="document-wrapper">
                    <div class="watermark">CDC INTERNATIONAL</div>
                    <header>
                        <div class="logo-container">
                            ${logoBase64 ? `<img src="data:image/svg+xml;base64,${logoBase64}" alt="Company Logo" />` : '<div class="badge">Official System Record</div>'}
                        </div>
                        <h1 class="doc-title">Employment Agreement</h1>
                        <div class="meta-info">
                            This agreement is concluded between <strong>CDC International</strong> and <strong>${application.fullName}</strong>.
                        </div>
                    </header>

                    <div class="divider"></div>

                    <div class="content">
                        ${application.signedContent.map((section, idx) => `
                            <div class="section">
                                <div class="section-header">
                                    <span class="section-num">${(idx + 1).toString().padStart(2, '0')}</span>
                                    <h2 class="section-title">${section.title}</h2>
                                </div>
                                <div class="section-body">
                                    ${section.content}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="signature-area-wrapper">
                        <div class="signature-section">
                            <div class="sig-placeholder">
                                <div class="sig-label">Candidate Signature</div>
                                <div class="sig-line">${application.signatureName}</div>
                                <div class="sig-details">
                                    <strong>Date Signed:</strong> ${new Date(application.signedAt).toLocaleString()}<br/>
                                    <strong>Legal Name:</strong> ${application.fullName}
                                </div>
                            </div>
                            <div class="sig-placeholder" style="text-align: right;">
                                <div class="sig-label">Digital Attestation</div>
                                <div class="qr-container" style="margin-bottom: 8px;">
                                    <img src="${qrCodeDataUrl}" style="width: 70px; height: 70px; border: 1px solid #e5e7eb; padding: 4px; border-radius: 4px;" />
                                </div>
                                <div class="verification-badge">
                                    <svg width="8" height="8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                    Authenticity Verified
                                </div>
                                <div class="doc-id-small">
                                    <strong>REF:</strong> ${docId}
                                </div>
                            </div>
                        </div>
                        <footer>
                            &copy; ${new Date().getFullYear()} CDC International • Human Resources Division • Confidential Record
                        </footer>
                    </div>
                </div>
            </body>
            </html>
            `;

            const pdfBuffer = await generatePdfFromHtml(htmlContent, {
                headerTemplate,
                footerTemplate,
                marginTop: '25mm',
                marginBottom: '25mm'
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Agreement_${application.fullName.replace(/\s+/g, '_')}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('PDF Download Error:', error);
            res.status(500).json({ message: error.message });
        }
    },

    verifyAgreementSignature: async (req, res) => {
        try {
            const { id } = req.params;
            let application, job;

            // Try finding by application ID or token
            job = await Job.findOne({
                $or: [
                    { "applications._id": id },
                    { "applications.onboardingToken": id }
                ]
            });

            if (!job) {
                return res.status(404).json({ message: 'Agreement record not found.' });
            }

            application = job.applications.id(id) || job.applications.find(app => app.onboardingToken === id);

            if (!application || !application.agreementSigned) {
                return res.status(404).json({ message: 'Agreement not found or not signed.' });
            }

            res.json({
                valid: true,
                issuer: "CDC International Human Resources",
                issuedTo: application.fullName,
                date: application.signedAt,
                ipAddress: application.signingIp || "Not captured",
                signatureName: application.signatureName,
                documentId: (application._id || id).toString().toUpperCase(),
                jobTitle: job.title
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
