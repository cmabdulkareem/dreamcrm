import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CallList from '../model/callListModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function runTests() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Clean up any existing data for our test brands
        const brandA = new mongoose.Types.ObjectId();
        const brandB = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        // console.log('\n--- Syncing Indices ---');
        // await CallList.syncIndexes();
        // console.log('Indices synced.');

        console.log('\n--- Testing Single Creation & Uniqueness ---');

        // 1. Create a call list entry
        const entry1 = await CallList.create({
            name: 'Test 1',
            phoneNumber: '1234567890',
            brand: brandA,
            createdBy: userId
        });
        console.log('SUCCESS: Created entry with 1234567890 in Brand A');

        // 2. Try to create same number in same brand
        try {
            await CallList.create({
                name: 'Test 2',
                phoneNumber: '1234567890',
                brand: brandA,
                createdBy: userId
            });
            console.error('FAIL: Created duplicate number in same brand (Model level)');
        } catch (err) {
            console.log('SUCCESS: Model blocked duplicate number in same brand');
        }

        // 3. Create same number in different brand
        const entry2 = await CallList.create({
            name: 'Test 3',
            phoneNumber: '1234567890',
            brand: brandB,
            createdBy: userId
        });
        console.log('SUCCESS: Created same number 1234567890 in Brand B');

        // 4. Test empty phone number (should allow multiples)
        const empty1 = await CallList.create({
            name: 'Empty 1',
            phoneNumber: '',
            brand: brandA,
            createdBy: userId
        });
        const empty2 = await CallList.create({
            name: 'Empty 2',
            phoneNumber: '',
            brand: brandA,
            createdBy: userId
        });
        console.log('SUCCESS: Created multiple entries with empty phone numbers in Brand A');

        console.log('\n--- Testing Update Uniqueness ---');

        // 5. Try to update an existing entry to a number that already exists in the same brand
        try {
            const entry4 = await CallList.create({
                name: 'Test 4',
                phoneNumber: '9999999999',
                brand: brandA,
                createdBy: userId
            });
            entry4.phoneNumber = '1234567890';
            await entry4.save();
            console.error('FAIL: Allowed update to existing number in same brand');
        } catch (err) {
            console.log('SUCCESS: Blocked update to existing number in same brand');
        }

        console.log('\n--- Cleanup ---');
        await CallList.deleteMany({ brand: { $in: [brandA, brandB] } });
        console.log('Test data cleaned up.');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
