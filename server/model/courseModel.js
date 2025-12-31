import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  modules: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  singleShotFee: {
    type: Number,
    required: true,
    min: 0
  },
  normalFee: {
    type: Number,
    required: true,
    min: 0
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

// Compound index: courseCode must be unique within each brand
courseSchema.index({ courseCode: 1, brand: 1 }, { unique: true });
// Compound index: courseName must be unique within each brand
courseSchema.index({ courseName: 1, brand: 1 }, { unique: true });

export default mongoose.model('Course', courseSchema);