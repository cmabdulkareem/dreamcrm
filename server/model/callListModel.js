import mongoose from 'mongoose';

const callListSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: ''
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: ''
    },
    socialMediaId: {
        type: String,
        trim: true,
        default: ''
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    source: {
        type: String,
        trim: true,
        default: ''
    },
    purpose: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: [
            'pending',
            'interested',
            'not-interested',
            'failed',
            'converted',
            // Keep old statuses temporarily for migration safety if needed, 
            // but strictly we should migrate them all. 
            // Adding them here prevents validation errors before migration.
            'interested-wants-details',
            'very-interested',
            'neutral',
            'callback-requested',
            'copied-to-lead',
            'no-answer',
            'busy',
            'switched-off',
            'invalid-number',
            'call-dropped'
        ],
        default: 'pending'
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
callListSchema.index({ brand: 1, createdAt: -1 });
callListSchema.index({ brand: 1, assignedTo: 1, createdAt: -1 });

// Unique index for phoneNumber scoped by brand
// Use partialFilterExpression to allow multiple empty phone numbers
callListSchema.index(
    { brand: 1, phoneNumber: 1 },
    {
        unique: true,
        partialFilterExpression: { phoneNumber: { $ne: "" } }
    }
);

const CallList = mongoose.model('CallList', callListSchema);
export default CallList;
