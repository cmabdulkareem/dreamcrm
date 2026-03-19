import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const batchSchema = new mongoose.Schema({
    batchName: String,
    attendance: [{
        date: Date,
        records: Array
    }]
}, { strict: false });

const Batch = mongoose.model('Batch', batchSchema);

async function inspectBatch() {
    let output = "";
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findOne({ batchName: 'BAT-CDCDZMNG-250117-001' });
        
        if (!batch) {
            output += 'Batch not found\n';
            fs.writeFileSync('all_attendance.txt', output);
            return;
        }

        output += `Batch: ${batch.batchName}\n`;
        
        const attendanceDates = batch.attendance?.map(a => ({
            iso: a.date.toISOString(),
            local: a.date.toLocaleString()
        })) || [];

        output += '--- ALL ATTENDANCE DATES ---\n';
        output += JSON.stringify(attendanceDates, null, 2);

        fs.writeFileSync('all_attendance.txt', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('all_attendance.txt', err.toString());
    }
}

inspectBatch();
