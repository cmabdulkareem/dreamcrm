
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CallList from '../model/callListModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.resolve(__dirname, '../../.env');
// Correct way to get the root .env based on structure: e:\crm\server\scripts -> e:\crm\.env
// Adjusted to match confirmed structure e:\crm\server\scripts -> ../../.env (if server is in root) or ../../../.env
// Let's assume server is at e:\crm\server, so scripts is e:\crm\server\scripts.
// ../../.env would be e:\crm\.env
console.log(`Resolved .env path: ${envPath}`);

let loadedEnvPath = envPath; // Default to the primary path

if (fs.existsSync(envPath)) {
    console.log(".env file EXISTS at this path.");
} else {
    console.log(".env file does NOT exist at this path.");
    // Try one level up just in case
    const altEnvPath = path.resolve(__dirname, '../../../.env');
    console.log(`Checking alternative: ${altEnvPath}`);
    if (fs.existsSync(altEnvPath)) {
        console.log("Found at alternative path!");
        loadedEnvPath = altEnvPath; // Use the alternative path
    } else {
        console.log("Alternative .env path also not found.");
    }
}

console.log(`Attempting to load .env from: ${loadedEnvPath}`);
dotenv.config({ path: loadedEnvPath });

// Fallback: try loading from process current directory if file not found
if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI not found via path, trying defaults...");
    dotenv.config();
}

if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in .env file.");
    process.exit(1);
}

const migrateAssignments = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Finding unassigned call list entries...");
        const unassignedEntries = await CallList.find({
            $or: [
                { assignedTo: null },
                { assignedTo: { $exists: false } }
            ]
        });

        console.log(`Found ${unassignedEntries.length} unassigned entries.`);

        let updatedCount = 0;
        for (const entry of unassignedEntries) {
            if (entry.createdBy) {
                entry.assignedTo = entry.createdBy;
                await entry.save();
                updatedCount++;
                process.stdout.write(`\rUpdated: ${updatedCount}/${unassignedEntries.length}`);
            } else {
                console.log(`\nSkipping entry ${entry._id} (No createdBy field)`);
            }
        }

        console.log(`\nMigration complete. Updated ${updatedCount} entries.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateAssignments();
