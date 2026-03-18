import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    batchName: {
        type: String,
        required: false, // Optional for placeholders
        trim: true
    },
    slot: {
        type: Number,
        required: true,
        default: 0
    },
    isSlot: {
        type: Boolean,
        default: false
    },
    instructorName: {
        type: String,
        required: true,
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for older records, but will be enforced for new ones via logic
    },
    mode: {
        type: String,
        enum: ['online', 'offline', 'hybrid'],
        required: false,
        default: 'online'
    },
    subject: {
        type: String,
        required: false,
        trim: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: false
    },
    startDate: {
        type: Date,
        required: false
    },
    expectedEndDate: {
        type: Date,
        required: false
    },
    batchTime: {
        from: {
            type: String,
            required: false
        },
        to: {
            type: String,
            required: false
        }
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shareToken: {
        type: String,
        unique: true
    },
    students: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: false // Can be null for legacy/manual entries
        },
        studentName: {
            type: String,
            required: true
        },
        dob: {
            type: Date
        },
        phoneNumber: {
            type: String
        },
        parentPhoneNumber: {
            type: String
        },
        status: {
            type: String,
            enum: ['Active', 'Dropped', 'Completed'],
            default: 'Active'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        records: [{
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true // This should match the _id of the object in the students array
            },
            studentName: {
                type: String
            },
            status: {
                type: String,
                enum: ['Present', 'Absent', 'Late', 'Excused', 'Holiday', 'Week Off'],
                required: true
            },
            remarks: {
                type: String
            }
        }]
    }]
}, {
    timestamps: true
});

// Generate shareToken before saving if not exists
batchSchema.pre('save', function (next) {
    if (!this.shareToken) {
        this.shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    next();
});

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
