import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContactPoint from '../model/contactPointModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function checkIndices() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const indices = await ContactPoint.collection.getIndexes();
        console.log('Current Indices:', JSON.stringify(indices, null, 2));

    } catch (error) {
        console.error('Error checking indices:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndices();
