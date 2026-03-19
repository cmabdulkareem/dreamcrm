import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../model/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const verify = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const users = await User.find({}).limit(3);
        
        console.log('--- Verification Report ---');
        users.forEach(user => {
            console.log(`User: ${user.fullName} (${user.email})`);
            console.log(`  joiningDate: ${user.joiningDate}`);
            console.log(`  reviewCycle: ${user.reviewCycle}`);
            console.log(`  nextReviewDate: ${user.nextReviewDate}`);
            console.log(`  bloodGroup: "${user.bloodGroup}"`);
            console.log(`  country: "${user.country}"`);
            console.log(`  state: "${user.state}"`);
            console.log('---------------------------');
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verify();
