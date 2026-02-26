import mongoose from "mongoose";

const labQueueSchema = new mongoose.Schema(
    {
        studentName: { type: String, required: true },
        purpose: { type: String, default: "" }, // e.g. course name
        batchPreference: {
            type: String,
            enum: ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"],
            required: true,
            default: "Early AM"
        },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },
        status: {
            type: String,
            enum: ["waiting", "assigned", "completed", "cancelled"],
            default: "waiting"
        }
    },
    { timestamps: true }
);

const LabQueue = mongoose.model("LabQueue", labQueueSchema);
export default LabQueue;
