import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerModel from './model/customerModel.js';

dotenv.config();

const listAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const all = await customerModel.find({}).lean();
        console.log(`Total customers found: ${all.length}`);

        all.forEach((c, i) => {
            console.log(`${i + 1}. ${c.fullName} - Status: ${c.leadStatus}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('List failed:', error);
        process.exit(1);
    }
};

listAll();
