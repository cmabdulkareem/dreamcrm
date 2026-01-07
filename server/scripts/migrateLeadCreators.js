
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../model/customerModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

if (!process.env.MONGODB_URI) {
    dotenv.config();
}

const migrateCreators = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Finding leads without createdBy field...");
        const leads = await Customer.find({
            $or: [
                { createdBy: null },
                { createdBy: { $exists: false } }
            ]
        });

        console.log(`Found ${leads.length} leads to update.`);

        let updatedCount = 0;
        for (const lead of leads) {
            // Heuristic: If createdBy is missing, use assignedBy (as that's often the creator in this system)
            // If assignedBy is also missing, we'll have to keep it null or try to find a user by handledBy name (risky)
            if (lead.assignedBy) {
                lead.createdBy = lead.assignedBy;
                await lead.save();
                updatedCount++;
                process.stdout.write(`\rUpdated: ${updatedCount}/${leads.length}`);
            } else if (lead.assignedTo) {
                // Fallback to assignedTo if assignedBy is null
                lead.createdBy = lead.assignedTo;
                await lead.save();
                updatedCount++;
                process.stdout.write(`\rUpdated: ${updatedCount}/${leads.length}`);
            }
        }

        console.log(`\nMigration complete. Updated ${updatedCount} leads.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateCreators();
