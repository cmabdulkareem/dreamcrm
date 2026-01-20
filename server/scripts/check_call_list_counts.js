import { config } from "dotenv";
config({ quiet: true });
import mongoose from "mongoose";
import CallList from "../model/callListModel.js";

const checkCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await CallList.countDocuments({});
        console.log(`Total CallList records: ${count}`);

        const statuses = await CallList.distinct('status');
        console.log(`Existing statuses: ${statuses.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
};

checkCounts();
