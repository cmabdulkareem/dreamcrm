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

        let successCount = 0;
        let failCount = 0;

        for (const entry of entriesWithLegacyRemarks) {
            try {
                const oldRemark = entry.remarks;

                // Convert to array format
                // If empty string, start with empty array, else wrap the string as the first remark
                entry.remarks = oldRemark.trim() ? [{
                    remark: oldRemark.trim(),
                    status: entry.status || 'pending',
                    updatedBy: entry.createdBy || null,
                    updatedOn: entry.createdAt || new Date()
                }] : [];

                // Use updateOne to bypass any schema validation issues during migration if necessary,
                // or just save if the model is updated. 
                await CallList.updateOne(
                    { _id: entry._id },
                    { $set: { remarks: entry.remarks } }
                );
                
                successCount++;
                if (successCount % 100 === 0) {
                    console.log(`Migrated ${successCount} entries...`);
                }
            } catch (err) {
                console.error(`Failed to migrate entry ${entry._id}:`, err.message);
                failCount++;
            }
        }

        console.log(`Migration completed. Success: ${successCount}, Failed: ${failCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();

