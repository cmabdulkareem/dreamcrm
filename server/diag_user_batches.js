import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Batch = mongoose.model('Batch', new mongoose.Schema({}, { strict: false }));

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        const email = 'athirarajeevan938@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(JSON.stringify({ error: 'USER_NOT_FOUND' }));
            process.exit(0);
        }

        const batches = await Batch.find({
            $or: [
                { instructor: user._id },
                { instructorName: user.fullName }
            ]
        });

        const results = {
            userId: user._id,
            userName: user.fullName,
            userRoles: user.roles,
            batchCount: batches.length,
            batches: batches.map(b => ({
                name: b.batchName,
                instructorId: b.instructor,
                instructorName: b.instructorName
            }))
        };

        console.log('START_RESULTS');
        console.log(JSON.stringify(results, null, 2));
        console.log('END_RESULTS');

        process.exit(0);
    } catch (error) {
        console.log(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

diagnose();
