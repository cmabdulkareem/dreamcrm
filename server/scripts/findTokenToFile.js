import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const batchSchema = new mongoose.Schema({
    batchName: String,
    shareToken: String
}, { strict: false });

const Batch = mongoose.model('Batch', batchSchema);

async function findToken() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const batch = await Batch.findOne({ batchName: 'BAT-CDCDZMNG-250117-001' });
        fs.writeFileSync('share_token.txt', batch?.shareToken || 'NONE');
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('share_token.txt', err.toString());
    }
}

findToken();
