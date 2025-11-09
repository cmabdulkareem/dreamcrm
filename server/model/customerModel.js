import mongoose from 'mongoose';

const remarkSchema = new mongoose.Schema({
  updatedOn: {
    type: Date,
    default: Date.now
  },
  nextFollowUpDate: {
    type: Date
  },
  handledBy: {
    type: String
  },
  remark: {
    type: String
  },
  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'callBackLater', 'notInterested', 'lost'],
    default: 'new'
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['studying', 'working', 'selfEmployed', 'freelancer', 'homeMaker', 'jobSeeker', 'doingNothing']
  },
  education: {
    type: String,
    enum: ['notEducated', 'below10th', '10th', '12th', 'diploma', 'graduate', 'postGraduate']
  },
  coursePreference: [{
    type: String
  }],
  contactPoint: {
    type: String
  },
  otherContactPoint: {
    type: String
  },
  campaign: {
    type: String
  },
  handledBy: {
    type: String
  },
  followUpDate: {
    type: Date
  },
  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'callBackLater', 'notInterested', 'lost'],
    default: 'new'
  },
  remarks: [remarkSchema]
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);
