import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
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
        required: false
    },
    coverLetter: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Interviewed', 'Rejected', 'Offer', 'Hired'],
        default: 'Pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['Online', 'Manual'],
        default: 'Online'
    },
    interviewDate: {
        type: Date,
        default: null
    },
    interviewTime: {
        type: String,
        default: null
    },
    onboardingToken: {
        type: String,
        default: null
    },
    agreementTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AgreementTemplate',
        default: null
    },
    agreementSigned: {
        type: Boolean,
        default: false
    },
    signedAt: {
        type: Date,
        default: null
    },
    signedContent: [{
        title: String,
        content: String
    }],
    signatureName: {
        type: String,
        default: null
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

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time'
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Draft'],
        default: 'Active'
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    requirements: {
        type: String,
        default: ''
    },
    applications: [applicationSchema],
    postedDate: {
        type: Date,
        default: Date.now
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

const Job = mongoose.model('Job', jobSchema);
export default Job;
