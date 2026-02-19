import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const customers = db.collection('customers');

        const count = await customers.countDocuments();
        console.log('Total customers in collection:', count);

        const dhanya = await customers.findOne({ fullName: { $regex: /dhanya/i } });
        if (dhanya) {
            console.log('Found Dhanya:', JSON.stringify(dhanya, null, 2));
        } else {
            console.log('Dhanya not found even with native driver');
            const sample = await customers.find().limit(3).toArray();
            console.log('Sample data:', JSON.stringify(sample, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();
