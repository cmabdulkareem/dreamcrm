import mongoose from 'mongoose';
import dotenv from 'dotenv';

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
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findOne({ batchName: 'BAT-CDCDZMNG-250117-001' });
        
        if (!batch) {
            console.log('Batch not found');
            return;
        }

        console.log(`Batch: ${batch.batchName}`);
        
        const attendanceDates = batch.attendance?.map(a => ({
            raw: a.date,
            iso: a.date.toISOString(),
            local: a.date.toLocaleString()
        })) || [];

        console.log('--- ALL ATTENDANCE DATES ---');
        console.log(JSON.stringify(attendanceDates, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

inspectBatch();
