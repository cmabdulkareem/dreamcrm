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
  additionalCourses: {
    type: [String],
    default: []
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  feeBreakdown: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    name: String, // Course or Module name
    basePrice: Number,
    discountPercentage: Number,
    discountAmount: Number,
    finalAmount: Number,
    type: { type: String, enum: ['course', 'module'], default: 'course' }
  }],
  complimentaryModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  remarks: {
    type: String,
    default: ""
  },
  totalCourseValue: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  enrollmentDate: {
    type: Date,
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  createdBy: {
    type: String
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  batchScheduled: {
    type: Boolean,
    default: false
  },
  feeType: {
    type: String,
    enum: ['singleShot', 'normal'],
    default: 'normal'
  },
  currentModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  completedModules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  history: [{
    status: { type: String }, // e.g., 'Started', 'Completed', 'Admission Taken'
    moduleName: { type: String }, // Track which module/batch this entry belongs to
    metadata: { type: mongoose.Schema.Types.Mixed }, // NEW: Store additional context like batchId, moduleId for linking
    remark: { type: String },
    updatedOn: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  academicStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Student', studentSchema);