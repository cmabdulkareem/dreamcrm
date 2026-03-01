import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    resumeUrl: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Interviewed', 'Rejected', 'Hired'],
        default: 'Pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    history: [{
        status: String,
        remark: String,
        updatedOn: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
