import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../model/userModel.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully.');

        const users = await User.find({});
        console.log(`Found ${users.length} users. Starting migration...`);

        let updatedCount = 0;

        for (const user of users) {
            let updated = false;

            // 1. Initialize joiningDate
            if (!user.joiningDate) {
                user.joiningDate = user.createdAt || new Date();
                updated = true;
                console.log(`- Set joiningDate for ${user.fullName}`);
            }

            // 2. Set reviewCycle to 3-month (matching controller logic)
            if (user.reviewCycle !== '3-month') {
                user.reviewCycle = '3-month';
                updated = true;
                console.log(`- Set reviewCycle to 3-month for ${user.fullName}`);
            }

            // 3. Initialize/Update nextReviewDate
            // If it's missing or if we just set a new joiningDate/reviewCycle, recalculate
            if (!user.nextReviewDate) {
                const nextReview = new Date(user.joiningDate);
                nextReview.setMonth(nextReview.getMonth() + 3);
                user.nextReviewDate = nextReview;
                updated = true;
                console.log(`- Initialized nextReviewDate for ${user.fullName}: ${nextReview.toLocaleDateString()}`);
            }

            // 4. Initialize profile fields if they are missing (to ensure consistency)
            const fieldsToInit = ['bloodGroup', 'country', 'state', 'location', 'company', 'employeeCode', 'instagram'];
            fieldsToInit.forEach(field => {
                if (user[field] === undefined || user[field] === null) {
                    user[field] = (field === 'location') ? "DreamZone, Kasaragod" : "";
                    updated = true;
                }
            });

            if (user.dob === undefined) {
                user.dob = null;
                updated = true;
            }

            if (updated) {
                await user.save();
                updatedCount++;
            }
        }

        console.log(`\nMigration completed! Updated ${updatedCount} user documents.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\nMigration failed:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

migrate();
