import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'REMARK', 'LOGIN'
        required: true,
        index: true
    },
    module: {
        type: String, // e.g., 'Leads', 'Students', 'Finance', 'Events'
        required: true,
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

// Compound index for efficient stats queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
