import mongoose from "mongoose";

const labSectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true
    }
}, { timestamps: true });

const LabSection = mongoose.model("LabSection", labSectionSchema);
export default LabSection;
