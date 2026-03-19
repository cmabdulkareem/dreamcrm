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
            fs.writeFileSync('march13_check.txt', output);
            return;
        }

        output += `Batch: ${batch.batchName}\n`;
        
        const march13Record = batch.attendance?.find(a => {
            const d = new Date(a.date);
            return d.toISOString().startsWith('2026-03-12T18:30') || d.toISOString().startsWith('2026-03-13T00:00');
        });

        if (march13Record) {
            output += `Found record for ${march13Record.date.toISOString()}\n`;
            march13Record.records.forEach(r => {
                output += `  Student: ${r.studentName}, Status: ${r.status}\n`;
            });
        } else {
            output += 'March 13 record NOT found\n';
        }

        fs.writeFileSync('march13_check.txt', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('march13_check.txt', err.toString());
    }
}

inspectBatch();
