import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const batchSchema = new mongoose.Schema({
    batchName: String,
    students: [{
        _id: mongoose.Schema.Types.ObjectId,
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String
    }],
    attendance: [{
        date: Date,
        records: [{
            studentId: mongoose.Schema.Types.ObjectId,
            studentName: String,
            status: String
        }]
    }]
}, { strict: false });

const Batch = mongoose.model('Batch', batchSchema);

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findById("6969f847b9ef220196550476");
        fs.writeFileSync('inspect_batch.json', JSON.stringify(batch, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('inspect_batch.json', err.toString());
    }
}

inspect();
