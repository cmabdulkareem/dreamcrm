import mongoose from 'mongoose';
import dotenv from 'dotenv';

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
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findOne({ batchName: 'BAT-CDCDZMNG-250117-001' });
        
        if (!batch) {
            console.log('Batch not found');
            return;
        }

        console.log(`Batch: ${batch.batchName}`);
        
        const feb17Record = batch.attendance?.find(a => {
            const d = new Date(a.date);
            // Feb 17 IST is Feb 16 18:30 UTC
            return d.toISOString().startsWith('2026-02-16T18:30') || d.toISOString().startsWith('2026-02-17T00:00');
        });

        if (feb17Record) {
            console.log(`Found record for ${feb17Record.date.toISOString()}`);
            console.log(`Records count: ${feb17Record.records?.length}`);
            feb17Record.records.forEach(r => {
                console.log(`  Student: ${r.studentName}, ID: ${r.studentId}, Status: ${r.status}`);
            });
        } else {
            console.log('Feb 17 record NOT found in attendance array');
        }

        console.log('Current Batch Students:');
        batch.students.forEach(s => {
            console.log(`  Student: ${s.studentName}, ID: ${s._id}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

inspectBatch();
