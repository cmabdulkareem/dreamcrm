import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Batch = mongoose.model('Batch', new mongoose.Schema({}, { strict: false }));

const user = await User.findOne({ email: 'athirarajeevan938@gmail.com' });
console.log('USER_NAME:', user.fullName);

const batches = await Batch.find({ $or: [{ instructor: user._id }, { instructorName: user.fullName }] });
console.log('BATCH_COUNT:', batches.length);

batches.forEach(b => {
    console.log('B:', b.batchName, '| INAME:', b.instructorName, '| IID:', b.instructor);
});

process.exit(0);
