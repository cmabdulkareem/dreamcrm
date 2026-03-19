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

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findById("6969f847b9ef220196550476");
        
        if (!batch) {
            console.log('Batch not found');
            return;
        }

        const stats = (batch.attendance || []).map(a => ({
            raw: a.date,
            iso: a.date.toISOString(),
            local: a.date.toLocaleString(),
            time: a.date.getTime()
        }));

        fs.writeFileSync('march_attendance_check.json', JSON.stringify(stats, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('march_attendance_check.json', err.toString());
    }
}

check();
