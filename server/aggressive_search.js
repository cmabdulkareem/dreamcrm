import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const aggressiveSearch = async () => {
    const databases = ["dreamcrm", "dreamzone", "homeworx", "porter", "admin", "local", "config"];
    const baseUri = "mongodb://dreamcrm_user:StrongPassword%40123@127.0.0.1:27017/";

    for (const dbName of databases) {
        try {
            const uri = `${baseUri}${dbName}?authSource=dreamcrm`;
            const conn = await mongoose.createConnection(uri).asPromise();
            const db = conn.db;
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const coll = db.collection(collInfo.name);
                const dhanya = await coll.findOne({ fullName: { $regex: /dhanya/i } });
                if (dhanya) {
                    console.log(`FOUND Dhanya in DB: ${dbName}, Collection: ${collInfo.name}`);
                    console.log(JSON.stringify(dhanya, null, 2));
                    process.exit(0);
                }

                const dhanyaK = await coll.findOne({ name: { $regex: /dhanya/i } });
                if (dhanyaK) {
                    console.log(`FOUND Dhanya (by name field) in DB: ${dbName}, Collection: ${collInfo.name}`);
                    console.log(JSON.stringify(dhanyaK, null, 2));
                    process.exit(0);
                }
            }
            await conn.close();
        } catch (err) {
            // console.error(`Error DB ${dbName}:`, err.message);
        }
    }
    console.log('Dhanya not found anywhere.');
    process.exit(0);
};

aggressiveSearch();
