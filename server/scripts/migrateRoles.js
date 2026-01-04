import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from '../model/userModel.js';
import '../config/db.js';

dotenv.config();

async function migrate() {
    try {
        console.log('Starting migration: Faculty / Trainers -> Instructor');

        const result = await userModel.updateMany(
            { roles: 'Faculty / Trainers' },
            { $set: { "roles.$[elem]": 'Instructor' } },
            { arrayFilters: [{ "elem": 'Faculty / Trainers' }] }
        );

        console.log(`Migration completed successfully.`);
        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
