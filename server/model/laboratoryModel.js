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

const workstationSchema = new mongoose.Schema({
    pcNumber: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["available", "in-use", "maintenance", "offline"], default: "available" },
    specs: { type: String, default: "" },
    location: { type: String, default: "" },
    row: { type: String, default: "A", trim: true, uppercase: true },
    position: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    softwares: { type: [String], default: [] },
    complaints: { type: [complaintSubSchema], default: [] }
}, { timestamps: true });

const labScheduleSchema = new mongoose.Schema({
    workstationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
    studentName: { type: String, trim: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    purpose: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });


const rowSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, uppercase: true },
    emptySlots: { type: [Number], default: [] }
}, { timestamps: true });

const labQueueSubSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    studentName: { type: String, trim: true },
    preferredSoftware: { type: String, default: "", trim: true },
    preferredSlot: { type: String, enum: ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"], default: "Early AM" },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["waiting", "assigned", "completed", "cancelled", "expired", "back-to-queue"], default: "waiting" },
    queuePosition: { type: Number, default: 0 },
    notes: { type: String, default: "" }
}, { timestamps: true });

const labSessionSubSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    studentName: { type: String, trim: true },
    pcId: { type: String, required: true },
    slot: { type: String, enum: ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"], default: "Early AM" },
    software: { type: String, default: "" },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    status: { type: String, enum: ["assigned", "active", "completed", "cancelled", "transferred"], default: "assigned" },
    metadata: { type: Object, default: {} },
    summary: { type: String, default: "" }
}, { timestamps: true });

const laboratorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        location: { type: String, default: "" },
        brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
        rows: [rowSchema],
        workstations: [workstationSchema],
        schedules: [labScheduleSchema],
        queue: [labQueueSubSchema],
        sessions: [labSessionSubSchema]
    },
    { timestamps: true }
);

const Laboratory = mongoose.model("Laboratory", laboratorySchema);
export default Laboratory;
