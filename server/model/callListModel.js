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
    status: {
        type: String,
        enum: ['pending', 'called', 'wrong-number', 'not-picked', 'busy', 'interested', 'not-interested'],
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
    }
}, {
    timestamps: true
});

// Index for efficient brand-based queries
callListSchema.index({ brand: 1, createdAt: -1 });

const CallList = mongoose.model('CallList', callListSchema);
export default CallList;
