import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const searchDreamzone = async () => {
    try {
        const uri = "mongodb://dreamcrm_user:StrongPassword%40123@127.0.0.1:27017/dreamzone?authSource=dreamcrm";
        await mongoose.connect(uri);
        console.log('Connected to dreamzone DB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections in dreamzone:');
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            if (count > 0) {
                console.log(`- ${coll.name}: ${count}`);
            }
        }

        const customers = db.collection('customers');
        const dhanya = await customers.findOne({ fullName: { $regex: /dhanya/i } });
        if (dhanya) {
            console.log('FOUND Dhanya in dreamzone!');
            console.log(JSON.stringify(dhanya, null, 2));
        } else {
            console.log('Dhanya not found in dreamzone.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

searchDreamzone();
