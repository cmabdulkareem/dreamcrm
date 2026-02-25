import mongoose from "mongoose";

const complaintSubSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNotes: { type: String, default: "" }
}, { timestamps: true });

const labPcSchema = new mongoose.Schema(
    {
        pcNumber: { type: String, required: true, trim: true, unique: true },
        label: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["available", "in-use", "maintenance", "offline"], default: "available" },
        specs: { type: String, default: "" },
        location: { type: String, default: "" },
        row: { type: String, default: "A", trim: true, uppercase: true },
        position: { type: Number, default: 0 },
        notes: { type: String, default: "" },
        softwares: { type: [String], default: [] },
        complaints: { type: [complaintSubSchema], default: [] }
    },
    { timestamps: true }
);

const LabPC = mongoose.model("LabPC", labPcSchema);
export default LabPC;
