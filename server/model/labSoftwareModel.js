import mongoose from "mongoose";

const labSoftwareSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        version: { type: String, trim: true, default: "" },
        licenseKey: { type: String, default: "" },
        licenseType: {
            type: String,
            enum: ["perpetual", "subscription", "freeware", "open-source", "trial", "other"],
            default: "other"
        },
        installedOn: [{ type: mongoose.Schema.Types.ObjectId, ref: "LabPC" }], // which PCs
        expiryDate: { type: Date, default: null },
        vendor: { type: String, default: "" },
        notes: { type: String, default: "" }
    },
    { timestamps: true }
);

const LabSoftware = mongoose.model("LabSoftware", labSoftwareSchema);
export default LabSoftware;
