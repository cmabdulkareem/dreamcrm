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
    }
}, {
    timestamps: true
});

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
