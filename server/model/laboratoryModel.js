import mongoose from "mongoose";

const laboratorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        location: { type: String, default: "" },
        brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
    },
    { timestamps: true }
);

const Laboratory = mongoose.model("Laboratory", laboratorySchema);
export default Laboratory;
