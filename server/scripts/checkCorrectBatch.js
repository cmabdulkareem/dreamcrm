import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const Batch = mongoose.model('Batch', new mongoose.Schema({}, { strict: false }));

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findOne({ batchName: 'BAT-CDCDZMNG-250117-001' });
        
        if (!batch) {
             fs.writeFileSync('correct_batch_attendance.json', 'Batch not found');
             await mongoose.disconnect();
             return;
        }

        const stats = (batch.attendance || []).map(a => ({
            raw: a.date,
            iso: a.date.toISOString(),
            local: a.date.toLocaleString(),
            time: a.date.getTime()
        }));

        fs.writeFileSync('correct_batch_attendance.json', JSON.stringify({
            batchId: batch._id,
            attendance: stats
        }, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('correct_batch_attendance.json', err.toString());
    }
}

check();
