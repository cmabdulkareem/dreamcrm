import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        records: [
            {
                studentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "BatchStudent", // or User depending on how students are stored
                    required: true
                },
                studentName: { type: String }, // redundant but useful for display
                status: {
                    type: String,
                    enum: ["Present", "Absent", "Late", "Excused", "Holiday", "Week Off"],
                    default: "Present"
                },
                remarks: { type: String }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Prevent duplicate attendance for the same batch on the same day
attendanceSchema.index({ batchId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
