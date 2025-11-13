import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'email', 'number', 'date', 'textarea', 'select'],
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String
  }] // For select fields
});

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    trim: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  registrationFields: [eventRegistrationSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  registrationLink: {
    type: String,
    unique: true
  },
  maxRegistrations: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  bannerImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Event', eventSchema);