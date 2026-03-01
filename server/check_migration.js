import mongoose from "mongoose";
import dotenv from "dotenv";
import Laboratory from "./model/laboratoryModel.js";

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/crm";

async function check() {
    try {
        console.log("Connecting to:", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        const labs = await Laboratory.find();
        console.log(`Found ${labs.length} laboratories.\n`);
        labs.forEach(l => {
            console.log(`Lab: ${l.name} (${l._id})`);
            console.log(`  Queue size: ${l.queue.length}`);
            console.log(`  Session size: ${l.sessions.length}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
