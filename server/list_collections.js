import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/crm";

async function listCollections() {
    try {
        await mongoose.connect(MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in DB:");
        collections.forEach(c => console.log(`- ${c.name}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listCollections();
