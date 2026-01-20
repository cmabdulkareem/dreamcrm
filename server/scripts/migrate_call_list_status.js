import { config } from "dotenv";
config({ quiet: true });
import mongoose from "mongoose";
import CallList from "../model/callListModel.js";

const migrateStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB connected for migration");

        const mapping = {
            'pending': 'neutral',
            'called': 'neutral',
            'wrong-number': 'invalid-number',
            'not-picked': 'no-answer',
            'busy': 'busy',
            'interested': 'interested-wants-details',
            'not-interested': 'not-interested',
            'copied-to-leads': 'copied-to-lead'
        };

        const callLists = await CallList.find({});
        console.log(`Found ${callLists.length} records to potentially migrate.`);

        let updatedCount = 0;
        for (const entry of callLists) {
            const newStatus = mapping[entry.status] || (mapping[entry.status?.toLowerCase()] || 'neutral');

            if (entry.status !== newStatus) {
                entry.status = newStatus;
                await entry.save();
                updatedCount++;
            }
        }

        console.log(`Migration completed. Updated ${updatedCount} records.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateStatuses();
