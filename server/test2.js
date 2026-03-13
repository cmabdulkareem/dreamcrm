const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const callListSchema = new mongoose.Schema({
    remarks: { type: mongoose.Schema.Types.Mixed, default: [] },
    callLogs: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { strict: false });

const CallList = mongoose.model('CallList', callListSchema, 'calllists');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const list = await CallList.findOne({ callLogs: { $exists: true, $not: {$size: 0} } }).sort({createdAt: -1});
    const list2 = await CallList.findOne({ remarks: { $exists: true, $not: {$size: 0} } }).sort({createdAt: -1});
    fs.writeFileSync('calllogs_output.json', JSON.stringify({
        withCallLogs: list,
        withRemarks: list2
    }, null, 2));
    process.exit(0);
};

run();
