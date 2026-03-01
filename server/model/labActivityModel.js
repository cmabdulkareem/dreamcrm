import mongoose from 'mongoose';

const labActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String, // e.g., 'LAB_QUEUE_ADD', 'LAB_SESSION_START', etc.
        required: true,
        index: true
    },
    module: {
        type: String,
        default: 'Lab',
        index: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    metadata: {
        type: Object,
        required: false
    }
}, {
    timestamps: true
});

// Compound indices for efficient queries
labActivitySchema.index({ userId: 1, createdAt: -1 });
labActivitySchema.index({ createdAt: -1 });
labActivitySchema.index({ "metadata.studentId": 1, createdAt: -1 });
labActivitySchema.index({ "metadata.labId": 1, createdAt: -1 });

export default mongoose.model('LabActivity', labActivitySchema);
