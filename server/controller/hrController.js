import Job from '../model/jobModel.js';
import User from '../model/userModel.js';
import Leave from '../model/leaveModel.js';
import AgreementTemplate from '../model/agreementTemplateModel.js';
import emailService from '../utils/emailService.js';
import crypto from 'crypto';
import { getFrontendUrl } from '../utils/urlHelper.js';

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
                        id: `app-${app._id}`,
                        type: 'application',
                        title: 'New Application',
                        description: `${app.fullName} applied for ${app.jobId?.title || 'a position'}`,
                        time: app.appliedDate
                    })),
                ...recentJoines.map(user => ({
                    id: `user-${user._id}`,
                    type: 'hire',
                    title: 'New Employee',
                    description: `${user.fullName} joined as ${user.designation || 'Staff'}`,
                    time: user.createdAt
                })),
                ...allStatusUpdates.map(update => ({
                    id: `upd-${update.appId}-${update.historyIdx}`,
                    type: 'status',
                    title: 'Status Updated',
                    description: `${update.fullName}'s application moved to ${update.status}`,
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
    }
};
