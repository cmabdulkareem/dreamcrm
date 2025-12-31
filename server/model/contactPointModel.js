import mongoose from 'mongoose';

const contactPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
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
}, { timestamps: true });

// Compound indices for brand-scoped uniqueness
contactPointSchema.index({ brand: 1, name: 1 }, { unique: true });
contactPointSchema.index({ brand: 1, value: 1 }, { unique: true });

const ContactPoint = mongoose.model('ContactPoint', contactPointSchema);

export default ContactPoint;