import mongoose from "mongoose";

const labComplaintSchema = new mongoose.Schema(
    {
        pc: { type: mongoose.Schema.Types.ObjectId, ref: "LabPC", required: true },
        raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "resolved"],
            default: "open"
        },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        resolvedAt: { type: Date, default: null },
        resolutionNotes: { type: String, default: "" }
    },
    { timestamps: true }
);

const LabComplaint = mongoose.model("LabComplaint", labComplaintSchema);
export default LabComplaint;
