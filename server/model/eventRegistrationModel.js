import mongoose from 'mongoose';

const registrationDataSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldValue: {
    type: String,
    required: true
  }
});

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registrationData: [registrationDataSchema],
  registrantEmail: {
    type: String,
    required: false,
    default: ''
  },
  registrantName: {
    type: String,
    required: false,
    default: ''
  },
  attended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('EventRegistration', eventRegistrationSchema);