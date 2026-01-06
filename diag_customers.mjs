import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const CustomerSchema = new mongoose.Schema({
    fullName: String,
    leadStatus: String,
    isAdmissionTaken: Boolean,
    brand: mongoose.Schema.Types.ObjectId
});

const Customer = mongoose.model('Customer', CustomerSchema);

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        const customers = await Customer.find({ fullName: /fat/i });
        console.log('FOUND_CUSTOMERS:');
        console.log(JSON.stringify(customers, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
