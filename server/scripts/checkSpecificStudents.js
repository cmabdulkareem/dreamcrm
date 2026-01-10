import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

const Student = mongoose.model('Student', new mongoose.Schema({
    fullName: String,
    finalAmount: Number,
    enrollmentDate: Date
}));

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const names = ['yaseen banna', 'Bhavyashree', 'Abdul Sajad'];
    for (const name of names) {
        const s = await Student.findOne({ fullName: new RegExp(name, 'i') });
        if (s) {
            console.log(`${s.fullName} | ${s.enrollmentDate.toISOString()} | ${s.finalAmount}`);
        } else {
            console.log(`${name} | NOT FOUND`);
        }
    }
    await mongoose.disconnect();
}
run();
