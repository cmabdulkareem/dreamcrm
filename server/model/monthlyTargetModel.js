import mongoose from 'mongoose';

const monthlyTargetSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 0,
    max: 11
  },
  targetRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create compound index to ensure unique target per month/year/brand
monthlyTargetSchema.index({ year: 1, month: 1, brand: 1 }, { unique: true });

export default mongoose.model('MonthlyTarget', monthlyTargetSchema);

