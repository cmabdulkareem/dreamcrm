import mongoose from 'mongoose';
import { config } from 'dotenv';
import Attendance from '../model/attendanceModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connected.");

        const allAttendance = await Attendance.find({});
        console.log(`Found ${allAttendance.length} attendance documents.`);

        let updatedCount = 0;
        for (const doc of allAttendance) {
            const date = new Date(doc.date);
            if (date.getDay() === 0) { // Sunday
                console.log(`Updating Sunday record for date: ${doc.date}`);

                // Update all records in this document to "Week Off"
                doc.records.forEach(rec => {
                    rec.status = "Week Off";
                });

                await doc.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} Sunday attendance documents to "Week Off".`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
