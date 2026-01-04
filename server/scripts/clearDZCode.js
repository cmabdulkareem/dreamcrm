import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from '../model/userModel.js';
import '../config/db.js';

dotenv.config();

async function migrate() {
    try {
        console.log('Starting migration: Clearing "DZ" employee codes');

        const result = await userModel.updateMany(
            { employeeCode: 'DZ' },
            { $set: { employeeCode: '' } }
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
