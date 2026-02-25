import mongoose from "mongoose";

const labRowSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            uppercase: true
        },
        // Empty (placeholder) slot positions within this row
        emptySlots: { type: [Number], default: [] }
    },
    { timestamps: true }
);

const LabRow = mongoose.model("LabRow", labRowSchema);
export default LabRow;
