import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const deepDiag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const collInfo of collections) {
            const doc = await db.collection(collInfo.name).findOne({});
            if (doc) {
                console.log(`\nCollection: ${collInfo.name} (Has Data)`);
                // console.log('Sample:', JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            } else {
                // console.log(`Collection: ${collInfo.name} (Empty)`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

deepDiag();
