import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const searchAll = async () => {
    const databases = ["dreamcrm", "dreamzone", "homeworx", "porter"];
    const baseUri = "mongodb://dreamcrm_user:StrongPassword%40123@127.0.0.1:27017/";

    for (const dbName of databases) {
        try {
            const uri = `${baseUri}${dbName}?authSource=dreamcrm`;
            const conn = await mongoose.createConnection(uri).asPromise();
            console.log(`Searching in ${dbName}...`);

            const Customer = conn.model('Customer', new mongoose.Schema({}, { strict: false }), 'customers');
            const lead = await Customer.findOne({ fullName: { $regex: /dhanya/i } });

            if (lead) {
                console.log(`FOUND in ${dbName}!`);
                console.log('Lead Details:', JSON.stringify(lead, null, 2));
                await conn.close();
                return;
            }
            await conn.close();
        } catch (err) {
            console.error(`Error searching ${dbName}:`, err.message);
        }
    }
    console.log('Not found in any expected database.');
    process.exit(0);
};

searchAll();
