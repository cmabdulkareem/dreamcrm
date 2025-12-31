import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContactPoint from '../model/contactPointModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function runTests() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Sync indices to ensure old ones are removed and new ones are created
        console.log('Syncing indices...');
        await ContactPoint.syncIndexes();
        console.log('Indices synced.');

        const brandA = new mongoose.Types.ObjectId();
        const brandB = new mongoose.Types.ObjectId();

        console.log('\n--- Testing Contact Point Brand-Scoped Uniqueness ---');

        // 1. Create Contact Point in Brand A
        const cpA1 = await ContactPoint.create({
            name: 'Cold Calls',
            value: 'cold-calls',
            brand: brandA
        });
        console.log('SUCCESS: Created "Cold Calls" in Brand A');

        // 2. Try to create same name in Brand A (should fail)
        try {
            await ContactPoint.create({
                name: 'Cold Calls',
                value: 'cold-calls-other',
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate name in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate name in same brand blocked (Model level)');
        }

        // 3. Try to create same value in Brand A (should fail)
        try {
            await ContactPoint.create({
                name: 'Other Name',
                value: 'cold-calls',
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate value in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate value in same brand blocked (Model level)');
        }

        // 4. Create "Cold Calls" in Brand B (should succeed)
        const cpB1 = await ContactPoint.create({
            name: 'Cold Calls',
            value: 'cold-calls',
            brand: brandB
        });
        console.log('SUCCESS: Created "Cold Calls" in Brand B (Different brand)');

        // 5. Create another CP in Brand A
        const cpA2 = await ContactPoint.create({
            name: 'Email Marketing',
            value: 'email-marketing',
            brand: brandA
        });
        console.log('SUCCESS: Created "Email Marketing" in Brand A');

        // 6. Try to update A2 to "Cold Calls" (should fail)
        try {
            cpA2.name = 'Cold Calls';
            cpA2.value = 'cold-calls';
            await cpA2.save();
            console.error('FAIL: Should not be able to update to existing name in same brand');
        } catch (err) {
            console.log('SUCCESS: Update to duplicate name/value in same brand blocked (Model level)');
        }

        // Cleanup
        await ContactPoint.deleteMany({ brand: { $in: [brandA, brandB] } });
        console.log('\nCleanup complete');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
