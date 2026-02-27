import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

// Minimal schema for migration
const callListSchema = new mongoose.Schema({
    remarks: mongoose.Schema.Types.Mixed // Use Mixed to handle both String and Array
}, { strict: false });

const CallList = mongoose.model('CallList', callListSchema);

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all documents where remarks is a string
        const entriesWithLegacyRemarks = await CallList.find({
            remarks: { $type: 'string' }
        });

        console.log(`Found ${entriesWithLegacyRemarks.length} entries with legacy string remarks.`);

        for (const entry of entriesWithLegacyRemarks) {
            const oldRemark = entry.remarks;

            // Convert to array format
            // If empty string, start with empty array, else wrap the string as the first remark
            entry.remarks = oldRemark.trim() ? [{
                remark: oldRemark,
                status: 'pending', // Fallback status
                updatedOn: entry.createdAt || new Date()
            }] : [];

            await entry.save();
            console.log(`Migrated entry: ${entry._id}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
