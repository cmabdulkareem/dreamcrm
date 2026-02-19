import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('Collection Counts:');
        for (const collInfo of collections) {
            const count = await db.collection(collInfo.name).countDocuments();
            if (count > 0) {
                console.log(`- ${collInfo.name}: ${count}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();
