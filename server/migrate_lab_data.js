import mongoose from "mongoose";
import dotenv from "dotenv";
import Laboratory from "./model/laboratoryModel.js";

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/crm";

async function migrate() {
    try {
        console.log("Connecting to MongoDB:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected Successfully.");

        const labs = await Laboratory.find();
        console.log(`Found ${labs.length} laboratories to migrate.`);

        const db = mongoose.connection.db;

        for (const lab of labs) {
            console.log(`\nProcessing Lab: ${lab.name} (${lab._id})`);

            // Migrate Queues
            const legacyQueues = await db.collection("labqueues").find({
                $or: [
                    { labId: lab._id },
                    { labId: lab._id.toString() }
                ]
            }).toArray();

            console.log(`  Found ${legacyQueues.length} legacy queue entries.`);

            let queueAddedCount = 0;
            legacyQueues.forEach(q => {
                const exists = lab.queue.some(existing => existing._id.toString() === q._id.toString());
                if (!exists) {
                    const qObj = { ...q };
                    delete qObj.labId;
                    lab.queue.push(qObj);
                    queueAddedCount++;
                }
            });
            console.log(`  Added ${queueAddedCount} new queue entries.`);

            // Migrate Sessions
            const legacySessions = await db.collection("labsessions").find({
                $or: [
                    { labId: lab._id },
                    { labId: lab._id.toString() }
                ]
            }).toArray();

            console.log(`  Found ${legacySessions.length} legacy sessions.`);

            let sessionAddedCount = 0;
            legacySessions.forEach(s => {
                const exists = lab.sessions.some(existing => existing._id.toString() === s._id.toString());
                if (!exists) {
                    const sObj = { ...s };
                    delete sObj.labId;
                    lab.sessions.push(sObj);
                    sessionAddedCount++;
                }
            });
            console.log(`  Added ${sessionAddedCount} new sessions.`);

            if (queueAddedCount > 0 || sessionAddedCount > 0) {
                await lab.save();
                console.log(`  Saved changes for ${lab.name}.`);
            } else {
                console.log(`  No new data to migrate for ${lab.name}.`);
            }
        }

        console.log("\nMigration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("\nMigration failed:", err);
        process.exit(1);
    }
}

migrate();
