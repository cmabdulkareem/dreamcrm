import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerModel from './model/customerModel.js';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const lead = await customerModel.findOne({
            fullName: { $regex: /dhanya/i }
        });

        if (lead) {
            console.log('Found lead:', lead.fullName);
            console.log('Status:', lead.leadStatus);
            console.log('ConvertedAt:', lead.convertedAt);
            console.log('Remarks:', JSON.stringify(lead.remarks, null, 2));
        } else {
            console.log('Lead not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();
