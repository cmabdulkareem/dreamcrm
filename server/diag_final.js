import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Batch = mongoose.model('Batch', new mongoose.Schema({}, { strict: false }));

const user = await User.findOne({ email: 'athirarajeevan938@gmail.com' });
const batches = await Batch.find({ batchName: /Design Fundamentals/i });

let log = '';
if (user) {
    log += `USER: name=[${user.fullName}] id=[${user._id}] roles=[${JSON.stringify(user.roles)}]\n`;
    log += `USER_NAME_HEX: ${Buffer.from(user.fullName).toString('hex')}\n`;
} else {
    log += 'USER NOT FOUND\n';
}

batches.forEach(b => {
    log += `BATCH: name=[${b.batchName}] instructorName=[${b.instructorName}] instructorId=[${b.instructor}] brand=[${b.brand}]\n`;
    if (b.instructorName) {
        log += `BATCH_INSTR_HEX: ${Buffer.from(b.instructorName).toString('hex')}\n`;
    }
});

fs.writeFileSync('diag_final.txt', log);
process.exit(0);
