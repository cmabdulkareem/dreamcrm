import mongoose from 'mongoose';

const courseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' } // Removed for independence
}, {
    timestamps: true
});

export default mongoose.model('CourseCategory', courseCategorySchema);
