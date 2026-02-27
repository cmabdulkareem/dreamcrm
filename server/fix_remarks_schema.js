import mongoose from 'mongoose';

// Minimal schema for migration
const callListSchema = new mongoose.Schema({
    remarks: mongoose.Schema.Types.Mixed // Use Mixed to handle both String and Array
}, { strict: false });

const CallList = mongoose.model('CallList', callListSchema);

export async function runRemarksMigration() {
    try {
        console.log('Checking for legacy remarks migration...');

        // Find all documents where remarks is a string
        const entriesWithLegacyRemarks = await CallList.find({
            remarks: { $type: 'string' }
        });

        if (entriesWithLegacyRemarks.length === 0) {
            console.log('No legacy remarks found. Migration not needed.');
            return;
        }

        console.log(`Found ${entriesWithLegacyRemarks.length} entries with legacy string remarks. Starting migration...`);

        let successCount = 0;
        let failCount = 0;

        for (const entry of entriesWithLegacyRemarks) {
            try {
                const oldRemark = entry.remarks;

                // Convert to array format
                entry.remarks = oldRemark.trim() ? [{
                    remark: oldRemark.trim(),
                    status: entry.status || 'pending',
                    updatedBy: entry.createdBy || null,
                    updatedOn: entry.createdAt || new Date()
                }] : [];

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
    } catch (error) {
        console.error('Migration failed:', error);
    }
}


