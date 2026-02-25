import mongoose from 'mongoose';

const promotionalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'raw'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  originalName: {
    type: String
  },
  size: {
    type: Number
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Promotional = mongoose.model('Promotional', promotionalSchema);

export default Promotional;
