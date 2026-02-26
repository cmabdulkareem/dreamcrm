import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function dropIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Drop index on labrows
        try {
            await db.collection('labrows').dropIndex('name_1');
            console.log('Dropped index name_1 on labrows');
        } catch (e) {
            console.log('Index name_1 on labrows does not exist or already dropped');
        }

        // Drop index on labpcs
        try {
            await db.collection('labpcs').dropIndex('pcNumber_1');
            console.log('Dropped index pcNumber_1 on labpcs');
        } catch (e) {
            console.log('Index pcNumber_1 on labpcs does not exist or already dropped');
        }

        console.log('Index cleanup complete');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

dropIndexes();
