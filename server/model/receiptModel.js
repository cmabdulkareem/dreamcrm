import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: true
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other'],
        required: true
    },
    referenceNumber: {
        type: String
    },
    notes: {
        type: String
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

// Compound unique index for receiptNumber and brand
receiptSchema.index({ receiptNumber: 1, brand: 1 }, { unique: true });

export default mongoose.model('ReceiptVoucher', receiptSchema);
