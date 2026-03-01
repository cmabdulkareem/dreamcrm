import mongoose from 'mongoose';

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
    applicants: {
        type: Number,
        default: 0
    },
    postedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Job = mongoose.model('Job', jobSchema);
export default Job;
