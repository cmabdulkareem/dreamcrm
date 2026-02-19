import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const diagAll = async () => {
    const databases = ["dreamcrm", "dreamzone", "homeworx", "porter", "admin", "local", "config"];
    const baseUri = "mongodb://dreamcrm_user:StrongPassword%40123@127.0.0.1:27017/";

    for (const dbName of databases) {
        try {
            const uri = `${baseUri}${dbName}?authSource=dreamcrm`;
            const conn = await mongoose.createConnection(uri).asPromise();
            console.log(`\nDB: ${dbName}`);

            const db = conn.db;
            const collections = await db.listCollections().toArray();

            for (const collInfo of collections) {
                const count = await db.collection(collInfo.name).countDocuments();
                if (count > 0) {
                    console.log(`- ${collInfo.name}: ${count}`);
                }
            }
            await conn.close();
        } catch (err) {
            console.error(`Error DB ${dbName}:`, err.message);
        }
    }
    process.exit(0);
};

diagAll();
