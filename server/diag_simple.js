import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerModel from './model/customerModel.js';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const total = await customerModel.countDocuments();
        console.log('Total leads in DB:', total);

        const someLeads = await customerModel.find().limit(5);
        console.log('Sample leads:');
        someLeads.forEach(l => console.log(`- ${l.fullName} (Status: ${l.leadStatus})`));

        const dhanyaFullMatch = await customerModel.findOne({ fullName: "dhanya kishor" });
        console.log('Dhanya exact match:', dhanyaFullMatch ? 'Found' : 'Not Found');

        process.exit(0);
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();
