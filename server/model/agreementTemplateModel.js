import mongoose from 'mongoose';

const agreementSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String, // HTML content from rich text editor
        required: true
    },
    order: {
        type: Number,
        default: 0
    }
});

const agreementTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sections: [agreementSectionSchema],
    isActive: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const AgreementTemplate = mongoose.model('AgreementTemplate', agreementTemplateSchema);
export default AgreementTemplate;
