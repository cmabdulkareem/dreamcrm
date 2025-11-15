import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "notDisclosed"], default: "notDisclosed" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeCode: { type: String, default: "DZ", uppercase: true, trim: true },
    instagram: { type: String, default: null, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    department: {
      type: String,
      enum: ["general", "managerial", "marketing", "placement", "counselling", "finance", "administration", "it", "interior", "fashion", "graphic", "other"],
      default: "general"
    },
    employmentType: {
      type: String,
      enum: ["fullTime", "partTime", "guest", "contract", "internship", "volunteer", "temporary", "seasonal"],
      default: "fullTime"
    },
    designation: { type: String, trim: true, default: "General" },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(value);
        },
        message: "Password must be at least 8 characters long, and include uppercase, lowercase, number, and special character."
      }
    },
    consent: { type: Boolean, required: true },
    accountStatus: { type: String, enum: ["Pending", "Active", "Suspended", "Deactivated"], default: "Pending" },
    isAdmin: { type: Boolean, default: false },
    
    // Role-based access control
    roles: { 
      type: [{
        type: String,
        enum: [
          'Owner',
          'Admin',
          'Center Head / Manager',
          'Academic Coordinator',
          'Counsellor',
          'Marketing / Social Media Executive',
          'Faculty / Trainers',
          'Placement Officer',
          'Lab Assistant',
          'CADD Club Support',
          'Accounts Executive',
          'Front Office / Receptionist',
          'IT Support',
          'Event Coordinator',
          'Housekeeping / Office Assistant',
          'PRO',
          'Manager', // Keep for backward compatibility
          'Marketing', // Keep for backward compatibility
          'Finance', // Keep for backward compatibility
          'Placement', // Keep for backward compatibility
          'General'
        ]
      }], 
      default: ['General'] 
    },
    
    // Added missing fields
    dob: { type: Date, default: null },
    joiningDate: { type: Date, default: null }, // new field added
    company: { type: String, default: "" },
    location: { type: String, default: "DreamZone, Kasaragod" },
    avatar: { type: String, default: null },
    
    // New profile fields
    bloodGroup: { type: String, default: "" },
    country: { type: String, default: "" },
    state: { type: String, default: "" },
    reportingHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true, // enable both createdAt and updatedAt
  }
);

// Pre-save middleware to handle first user as Owner
userSchema.pre('save', async function(next) {
  // Check if this is a new user
  if (this.isNew) {
    // Count existing users
    const userCount = await mongoose.model('User').countDocuments();
    
    // If this is the first user, make them Owner
    if (userCount === 0) {
      this.isAdmin = true;
      this.roles = ['Owner'];
      this.accountStatus = 'Active';
    }
  }
  next();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Remove sensitive fields
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model("User", userSchema);
export default User;