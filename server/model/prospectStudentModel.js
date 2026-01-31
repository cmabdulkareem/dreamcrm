import mongoose from 'mongoose';

const prospectStudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    socialMedia: {
        type: String,
        trim: true
    },
    place: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
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

const ProspectStudent = mongoose.model('ProspectStudent', prospectStudentSchema);
export default ProspectStudent;
