import { getFinancialYearRange } from '../utils/dateUtils.js';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

// Real models (importing them might be complex due to context, so I define them here)
const studentSchema = new mongoose.Schema({ enrollmentDate: Date, finalAmount: Number });
const paymentSchema = new mongoose.Schema({ paymentDate: Date, amount: Number, status: String });

const Student = mongoose.model('Student_Test', studentSchema, 'students');
const Payment = mongoose.model('Payment_Test', paymentSchema, 'payments');

async function testStats() {
    await mongoose.connect(process.env.MONGODB_URI);
    const now = new Date();
    const { startDate: fyStart, endDate: fyEnd } = getFinancialYearRange(now);

    const sumStudentRevenue = async (start, end) => {
        const result = await Student.aggregate([
            {
                $match: {
                    enrollmentDate: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$finalAmount" }
                }
            }
        ]);
        return result.length > 0 ? result[0].total : 0;
    };

    const fyRevenue = await sumStudentRevenue(fyStart, fyEnd);
    console.log(`FY Range: ${fyStart.toISOString()} to ${fyEnd.toISOString()}`);
    console.log(`FY Revenue (calculated via same logic): ${fyRevenue}`);

    await mongoose.disconnect();
}

testStats();
