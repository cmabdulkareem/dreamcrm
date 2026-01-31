import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
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

const Stream = mongoose.model('Stream', streamSchema);
export default Stream;
