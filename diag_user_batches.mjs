import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server directory
dotenv.config({ path: 'e:/crm/server/.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

// Define minimal schemas for diagnostics
const userSchema = new mongoose.Schema({
    email: String,
    fullName: String,
    roles: [String],
    role: String,
    isAdmin: Boolean
});

const batchSchema = new mongoose.Schema({
    batchName: String,
    instructorName: String,
    instructor: mongoose.Schema.Types.ObjectId,
    brand: mongoose.Schema.Types.ObjectId
});

const User = mongoose.model('User', userSchema);
const Batch = mongoose.model('Batch', batchSchema);

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'athirarajeevan938@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(0);
        }

        console.log('User found:');
        console.log(JSON.stringify(user, null, 2));

        const batchesByInstructorId = await Batch.find({ instructor: user._id });
        console.log(`\nBatches found by instructor ID (${user._id}):`);
        batchesByInstructorId.forEach(b => console.log(`- ${b.batchName} (ID: ${b._id})`));

        const batchesByInstructorName = await Batch.find({ instructorName: user.fullName });
        console.log(`\nBatches found by instructor name ("${user.fullName}"):`);
        batchesByInstructorName.forEach(b => console.log(`- ${b.batchName} (ID: ${b._id})`));

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis error:', error);
        process.exit(1);
    }
}

diagnose();
