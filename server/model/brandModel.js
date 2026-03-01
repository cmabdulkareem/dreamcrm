import mongoose from "mongoose";

const courseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const contactPointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
  cashback: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, trim: true },
  courseName: { type: String, required: true, trim: true },
  modules: { type: String, trim: true },
  duration: { type: Number, required: true, min: 1 },
  mode: { type: String, enum: ["online", "offline"], default: "online" },
  singleShotFee: { type: Number, required: true, min: 0 },
  normalFee: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  themeColor: { type: String, default: "#ED1164" },
  logo: { type: String, default: null },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: [courseSchema],
  campaigns: [campaignSchema],
  contactPoints: [contactPointSchema],
  courseCategories: [courseCategorySchema]
}, { timestamps: true });

// Ensure virtual fields are serialized
brandSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
