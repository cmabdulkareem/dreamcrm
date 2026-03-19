import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const batchSchema = new mongoose.Schema({
    batchName: String,
    startDate: Date,
    expectedEndDate: Date,
    instructorName: String
}, { strict: false });

const Batch = mongoose.model('Batch', batchSchema);

async function inspectBatches() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const batches = await Batch.find({ isSlot: false }).limit(5);
        
        console.log('--- Batch Date Inspection ---');
        batches.forEach(b => {
            console.log(`Batch: ${b.batchName}`);
            console.log(`  instructorName: ${b.instructorName}`);
            console.log(`  startDate: ${b.startDate} (Raw: ${JSON.stringify(b.startDate)})`);
            console.log(`  expectedEndDate: ${b.expectedEndDate} (Raw: ${JSON.stringify(b.expectedEndDate)})`);
            
            if (b.startDate) {
                const s = new Date(b.startDate);
                s.setHours(0,0,0,0);
                console.log(`  Normalized Start: ${s.toISOString()}`);
            }
            if (b.expectedEndDate) {
                const e = new Date(b.expectedEndDate);
                e.setHours(0,0,0,0);
                console.log(`  Normalized End: ${e.toISOString()}`);
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

inspectBatches();
