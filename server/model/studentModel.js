import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone1: {
    type: String,
    required: true
  },
  phone2: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dob: {
    type: Date
  },
  place: {
    type: String
  },
  otherPlace: {
    type: String
  },
  address: {
    type: String
  },
  aadharCardNumber: {
    type: String
  },
  photo: {
    type: String
  },
  status: {
    type: String,
    enum: ['studying', 'working', 'selfEmployed', 'freelancer', 'homeMaker', 'jobSeeker', 'doingNothing']
  },
  education: {
    type: String,
    enum: ['notEducated', 'below10th', '10th', '12th', 'diploma', 'graduate', 'postGraduate']
  },
  coursePreference: {
    type: String,
    required: true
  },
  enrollmentDate: {
    type: Date,
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Student', studentSchema);