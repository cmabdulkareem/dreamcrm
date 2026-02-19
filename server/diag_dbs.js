import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const diag = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', JSON.stringify(dbs.databases.map(d => d.name), null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Diag failed:', error);
        process.exit(1);
    }
};

diag();
