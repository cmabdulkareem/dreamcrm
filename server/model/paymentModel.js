import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Online'],
        required: true
    },
    transactionId: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true // Payments must be associated with a brand for filtering
    },
    receiptNumber: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
        default: 'Completed'
    }
}, {
    timestamps: true
});

// Generate Receipt Number middleware could go here
// but keeping it simple for now, maybe handle in controller

export default mongoose.model('Payment', paymentSchema);
