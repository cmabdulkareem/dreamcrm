import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const listCollections = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in database:');
        collections.forEach(c => console.log(`- ${c.name}`));

        process.exit(0);
    } catch (error) {
        console.error('List collections failed:', error);
        process.exit(1);
    }
};

listCollections();
