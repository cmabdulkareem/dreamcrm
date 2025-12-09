import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
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
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  cashback: {
    type: Number,
    min: 0,
    default: 0
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

// Ensure name and value are unique per brand
campaignSchema.index({ name: 1, brand: 1 }, { unique: true });
campaignSchema.index({ value: 1, brand: 1 }, { unique: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
