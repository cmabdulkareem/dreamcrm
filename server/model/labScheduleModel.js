import mongoose from "mongoose";

const labScheduleSchema = new mongoose.Schema(
    {
        pc: { type: mongoose.Schema.Types.ObjectId, ref: "LabPC", required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
        queueItem: { type: mongoose.Schema.Types.ObjectId, ref: "LabQueue", default: null },
        studentName: { type: String, default: "" }, // fallback if not linked to Student model
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: Date, required: true },
        timeSlot: {
            type: String,
            enum: ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"],
            required: true
        },
        purpose: { type: String, default: "" },       // e.g. batch name / course
        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled"],
            default: "scheduled"
        },
        notes: { type: String, default: "" }
    },
    { timestamps: true }
);

const LabSchedule = mongoose.model("LabSchedule", labScheduleSchema);
export default LabSchedule;
