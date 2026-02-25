import mongoose from "mongoose";

const labSlotSchema = new mongoose.Schema(
    {
        row: { type: String, required: true, trim: true, uppercase: true }, // e.g. "A"
        position: { type: Number, required: true },                       // e.g. 0
    },
    { timestamps: true }
);

labSlotSchema.index({ row: 1, position: 1 }, { unique: true });

const LabSlot = mongoose.model("LabSlot", labSlotSchema);
export default LabSlot;
