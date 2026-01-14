import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function migrate() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();
        const batchesColl = db.collection('batches');
        const usersColl = db.collection('users');

        const batches = await batchesColl.find({ instructor: { $exists: false } }).toArray();
        console.log(`Found ${batches.length} batches with missing instructor ID.`);

        let updatedCount = 0;
        for (const batch of batches) {
            if (batch.instructorName) {
                const user = await usersColl.findOne({ fullName: batch.instructorName });
                if (user) {
                    await batchesColl.updateOne(
                        { _id: batch._id },
                        { $set: { instructor: user._id } }
                    );
                    console.log(`Linked batch "${batch.batchName}" to instructor "${user.fullName}" (${user._id})`);
                    updatedCount++;
                } else {
                    console.warn(`Could not find user for instructor name "${batch.instructorName}" in batch "${batch.batchName}"`);
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} batches.`);
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
