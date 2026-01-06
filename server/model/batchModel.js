import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    batchName: {
        type: String,
        required: true,
        trim: true
    },
    instructorName: {
        type: String,
        required: true,
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for older records, but will be enforced for new ones via logic
    },
    mode: {
        type: String,
        enum: ['online', 'offline'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    expectedEndDate: {
        type: Date,
        required: true
    },
    batchTime: {
        from: {
            type: String,
            required: true
        },
        to: {
            type: String,
            required: true
        }
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
    shareToken: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate shareToken before saving if not exists
batchSchema.pre('save', function (next) {
    if (!this.shareToken) {
        this.shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    next();
});

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
