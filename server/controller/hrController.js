import Job from '../model/jobModel.js';
import User from '../model/userModel.js';
import JobApplication from '../model/jobApplicationModel.js';

export const hrController = {
    // Stats
    getStats: async (req, res) => {
        try {
            const totalEmployees = await User.countDocuments({ brands: { $exists: true, $not: { $size: 0 } } });
            const openPositions = await Job.countDocuments({ status: 'Active' });

            // Mocking these for now as we don't have Leave or Interview models yet
            const onLeaveToday = 0;
            const interviewsToday = 0;

            res.json({
                totalEmployees,
                onLeaveToday,
                openPositions,
                interviewsToday
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getRecentActivity: async (req, res) => {
        try {
            // Mock recent activity for now
            res.json([]);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Jobs
    getJobs: async (req, res) => {
        try {
            const jobs = await Job.find().sort({ postedDate: -1 });
            res.json(jobs);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getJob: async (req, res) => {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) return res.status(404).json({ message: 'Job not found' });
            res.json(job);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    createJob: async (req, res) => {
        try {
            const newJob = new Job(req.body);
            const savedJob = await newJob.save();
            res.status(201).json(savedJob);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    updateJob: async (req, res) => {
        try {
            const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

            const application = new JobApplication({
                jobId,
                fullName,
                email,
                phone,
                resumeUrl,
                coverLetter,
                history: [{
                    status: 'Pending',
                    remark: 'Entry Created'
                }]
            });

            await application.save();

            // Increment applicant count on job
            job.applicants = (job.applicants || 0) + 1;
            await job.save();

            res.status(201).json({ message: 'Application submitted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getJobApplications: async (req, res) => {
        try {
            const { id } = req.params;
            const applications = await JobApplication.find({ jobId: id }).sort({ appliedDate: -1 });
            res.json(applications);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllApplications: async (req, res) => {
        try {
            // Fetch all applications and populate job details
            const applications = await JobApplication.find()
                .populate('jobId', 'title brand department')
                .populate('history.updatedBy', 'fullName')
                .sort({ appliedDate: -1 });

            res.json(applications);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateApplicationStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, remark } = req.body;
            const userId = req.user?._id;

            const application = await JobApplication.findById(id);
            if (!application) return res.status(404).json({ message: 'Application not found' });

            const oldStatus = application.status;
            application.status = status;
            application.history.push({
                status,
                remark: remark || `Status updated from ${oldStatus} to ${status}`,
                updatedBy: userId,
                updatedOn: new Date()
            });

            await application.save();
            res.json(application);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};
