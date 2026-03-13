import dotenv from 'dotenv';
dotenv.config();
import connectDB from "./utils/db.js";
import CallList from './model/callListModel.js';
import fs from 'fs';

const run = async () => {
    await connectDB();
    const list = await CallList.findOne({ callLogs: { $exists: true, $not: {$size: 0} } }).sort({createdAt: -1});
    const list2 = await CallList.findOne({ remarks: { $exists: true, $not: {$size: 0} } }).sort({createdAt: -1});
    fs.writeFileSync('calllogs_output.json', JSON.stringify({
        callLogs: list?.callLogs?.slice(0,3),
        remarks: list2?.remarks?.slice(0,3)
    }, null, 2));
    process.exit(0);
};

run();
