import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true
        },
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            required: true
        },
        reason: {
            type: String,
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Unique holiday per brand per date
holidaySchema.index({ date: 1, brand: 1 }, { unique: true });

const Holiday = mongoose.model("Holiday", holidaySchema);
export default Holiday;
