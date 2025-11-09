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
        enum: ['Admin', 'Manager', 'Counsellor', 'Marketing', 'Finance', 'Placement', 'General']
      }], 
      default: ['General'] 
    },
    
    // Added missing fields
    dob: { type: Date, default: null },
    joiningDate: { type: Date, default: null }, // new field added
    company: { type: String, default: "" },
    location: { type: String, default: "DreamZone, Kasaragod" },
    avatar: { type: String, default: null },
  },
  {
    timestamps: true, // enable both createdAt and updatedAt
  }
);

// Pre-save middleware to handle first user as admin
userSchema.pre('save', async function(next) {
  // Check if this is a new user
  if (this.isNew) {
    // Count existing users
    const userCount = await mongoose.model('User').countDocuments();
    
    // If this is the first user, make them admin
    if (userCount === 0) {
      this.isAdmin = true;
      this.roles = ['Admin'];
      this.accountStatus = 'Active';
    }
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;