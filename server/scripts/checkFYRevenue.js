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

const Payment = mongoose.model('Payment', new mongoose.Schema({
    amount: Number,
    paymentDate: Date,
    status: String
}));

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI);

    const now = new Date();
    const fyStart = new Date(Date.UTC(2025, 3, 1)); // April 1, 2025
    const fyEnd = new Date(Date.UTC(2026, 2, 31, 23, 59, 59, 999)); // March 31, 2026

    const students = await Student.find({
        enrollmentDate: { $gte: fyStart, $lte: fyEnd }
    });

    const studentFYRevenue = students.reduce((sum, s) => sum + (s.finalAmount || 0), 0);

    const payments = await Payment.find({
        status: 'Completed',
        paymentDate: { $gte: fyStart, $lte: fyEnd }
    });

    const paymentFYRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log(`FY Range: ${fyStart.toISOString()} to ${fyEnd.toISOString()}`);
    console.log(`Students in FY: ${students.length}`);
    console.log(`Revenue from Students (Final Amount): ${studentFYRevenue}`);
    console.log(`Revenue from Payments (Completed): ${paymentFYRevenue}`);

    await mongoose.disconnect();
}

checkData();
