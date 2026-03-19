import mongoose from 'mongoose';
import dotenv from 'dotenv';

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
        console.log('TOKEN:', batch?.shareToken);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findToken();
