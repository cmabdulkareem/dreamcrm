import mongoose from 'mongoose';

const batchStudentSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true
    },
    studentId: {
        type: String,
        trim: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    parentPhoneNumber: {
        type: String,
        trim: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    }
}, {
    timestamps: true
});

// Since student data is independent, we might want to ensure studentId is unique within a batch or brand
// For now, let's keep it simple as per requirements.

const BatchStudent = mongoose.model('BatchStudent', batchStudentSchema);
export default BatchStudent;
