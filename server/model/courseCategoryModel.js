import mongoose from 'mongoose';

const courseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    }
}, {
    timestamps: true
});

// Compound index: category name must be unique within each brand
courseCategorySchema.index({ name: 1, brand: 1 }, { unique: true });

export default mongoose.model('CourseCategory', courseCategorySchema);
