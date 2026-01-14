import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const user = await mongoose.model('User', new mongoose.Schema({}, { strict: false })).findOne({ email: 'athirarajeevan938@gmail.com' });
console.log('UNAME:[' + user.fullName + ']');
const batches = await mongoose.model('Batch', new mongoose.Schema({}, { strict: false })).find({});
batches.forEach(b => {
    if (b.instructorName && b.instructorName.includes('Athira')) {
        console.log('BNAME:[' + b.batchName + '] BINAME:[' + b.instructorName + '] BIID:[' + b.instructor + ']');
    }
});
process.exit(0);
