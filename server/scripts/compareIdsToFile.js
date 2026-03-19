import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const batchSchema = new mongoose.Schema({
    batchName: String,
    attendance: [{
        date: Date,
        records: Array
    }],
    students: [{
        _id: mongoose.Schema.Types.ObjectId,
        studentName: String
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
            fs.writeFileSync('compare_ids.txt', output);
            return;
        }

        output += `Batch: ${batch.batchName}\n`;
        
        const feb17Record = batch.attendance?.find(a => {
            const d = new Date(a.date);
            return d.toISOString().startsWith('2026-02-16T18:30') || d.toISOString().startsWith('2026-02-17T00:00');
        });

        if (feb17Record) {
            output += `Found record for ${feb17Record.date.toISOString()}\n`;
            output += `Records count: ${feb17Record.records?.length}\n`;
            feb17Record.records.forEach(r => {
                output += `  Attendance Record -> Student: ${r.studentName}, ID: ${r.studentId}, Status: ${r.status}\n`;
            });
        } else {
            output += 'Feb 17 record NOT found in attendance array\n';
        }

        output += 'Current Batch Students List:\n';
        batch.students.forEach(s => {
            output += `  Batch Student -> Student: ${s.studentName}, ID: ${s._id}\n`;
        });

        fs.writeFileSync('compare_ids.txt', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('compare_ids.txt', err.toString());
    }
}

inspectBatch();
