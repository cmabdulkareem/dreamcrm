import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/crm";

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        const qSample = await db.collection("labqueues").findOne();
        console.log("LabQueue Sample Document:");
        console.log(JSON.stringify(qSample, null, 2));

        const sSample = await db.collection("labsessions").findOne();
        console.log("\nLabSession Sample Document:");
        console.log(JSON.stringify(sSample, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspect();
