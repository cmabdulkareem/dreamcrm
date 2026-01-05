import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerModel from '../model/customerModel.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connected");
    } catch (error) {
        console.error("DB connection failed", error);
        process.exit(1);
    }
};

const cleanup = async () => {
    await connectDB();

    // Define "today" as starting from midnight (local or UTC? DB usually UTC)
    // Assuming matching "todays date" means recent.
    // Let's check last 24 hours.
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // Midnight today local time (system time)

    console.log(`Checking for leads created after: ${startTime.toISOString()}`);

    const leads = await customerModel.find({ createdAt: { $gte: startTime } }).sort({ createdAt: 1 });

    console.log(`Total leads created today: ${leads.length}`);

    if (leads.length === 0) {
        console.log("No leads found for today.");
        await mongoose.disconnect();
        return;
    }

    // Group by minute
    const histogram = {};
    leads.forEach(l => {
        // Use ISO string for consistent grouping
        const key = l.createdAt.toISOString().substr(0, 16); // YYYY-MM-DDTHH:mm
        histogram[key] = (histogram[key] || 0) + 1;
    });

    console.log("Leads frequency by minute:");
    Object.entries(histogram).forEach(([time, count]) => {
        console.log(`${time}: ${count}`);
    });

    // Identify batch candidates (e.g., > 2 leads per minute implies fast creation)
    const batchMinutes = Object.keys(histogram).filter(time => histogram[time] > 2);

    if (batchMinutes.length > 0) {
        const totalInBatches = batchMinutes.reduce((sum, time) => sum + histogram[time], 0);
        console.log(`Found ${totalInBatches} leads in high-frequency windows.`);

        if (process.argv.includes('--delete')) {
            console.log("Deleting leads in these windows...");
            let deletedTotal = 0;
            for (const time of batchMinutes) {
                // Construct range for that minute
                const minStart = new Date(time + ":00.000Z");
                const minEnd = new Date(time + ":59.999Z");

                const result = await customerModel.deleteMany({
                    createdAt: { $gte: minStart, $lte: minEnd }
                });
                console.log(`Deleted ${result.deletedCount} leads for ${time}`);
                deletedTotal += result.deletedCount;
            }
            console.log(`Total deleted: ${deletedTotal}`);
        } else {
            console.log("PASS '--delete' ARGUMENT TO DELETE THESE LEADS.");
        }
    } else {
        console.log("No obvious batch/spike detected.");
    }

    await mongoose.disconnect();
};

cleanup();
