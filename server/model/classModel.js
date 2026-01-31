import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    stream: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stream',
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

const Class = mongoose.model('Class', classSchema);
export default Class;
