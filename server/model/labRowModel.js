import mongoose from "mongoose";

const labRowSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        // Empty (placeholder) slot positions within this row
        emptySlots: { type: [Number], default: [] },
        lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true }
    },
    { timestamps: true }
);

// Compound index for scoped uniqueness
labRowSchema.index({ name: 1, lab: 1 }, { unique: true });

const LabRow = mongoose.model("LabRow", labRowSchema);
export default LabRow;
