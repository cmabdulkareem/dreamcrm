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
  },
  // Add field to track if this remark is unread
  isUnread: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
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
    enum: ['notEducated', 'below10th', '10th', '12th', 'diploma', 'graduate', 'postGraduate', 'Other']
  },
  otherEducation: {
    type: String
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
  remarks: [remarkSchema],
  // Add fields for lead assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  assignmentRemark: {
    type: String
  },
  leadPotential: {
    type: String,
    enum: ['strongProspect', 'potentialProspect', 'weakProspect', 'notAProspect'],
    required: false // Explicitly set required to false
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  isAdmissionTaken: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Customer', customerSchema);