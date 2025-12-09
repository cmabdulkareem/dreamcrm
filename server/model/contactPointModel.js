import mongoose from 'mongoose';

const contactPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    unique: true,
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
    ref: 'Brand'
  }
}, { timestamps: true });

const ContactPoint = mongoose.model('ContactPoint', contactPointSchema);

export default ContactPoint;