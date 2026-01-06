import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    rate: {
        type: Number,
        required: true,
        default: 0
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    invoiceDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    items: [invoiceItemSchema],
    subTotal: {
        type: Number,
        required: true,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Void'],
        default: 'Draft'
    },
    notes: {
        type: String
    },
    terms: {
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

// Compound unique index for invoiceNumber and brand
invoiceSchema.index({ invoiceNumber: 1, brand: 1 }, { unique: true });

export default mongoose.model('Invoice', invoiceSchema);
