import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../model/campaignModel.js';
import CourseCategory from '../model/courseCategoryModel.js';
import Course from '../model/courseModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function runTests() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const brandA = new mongoose.Types.ObjectId();
        const brandB = new mongoose.Types.ObjectId();

        console.log('\n--- Testing Course Uniqueness ---');

        // 1. Create Course in Brand A
        const courseA1 = await Course.create({
            courseCode: 'C101',
            courseName: 'Course 101',
            duration: 10,
            singleShotFee: 1000,
            normalFee: 1200,
            brand: brandA
        });
        console.log('Created Course C101 in Brand A');

        // 2. Try to create same Course Code in Brand A (should fail)
        try {
            await Course.create({
                courseCode: 'C101',
                courseName: 'Different Name',
                duration: 5,
                singleShotFee: 500,
                normalFee: 600,
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate course code in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate course code in same brand blocked (Model level)');
        }

        // 3. Try to create same Course Name in Brand A (should fail)
        try {
            await Course.create({
                courseCode: 'C102',
                courseName: 'Course 101',
                duration: 5,
                singleShotFee: 500,
                normalFee: 600,
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate course name in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate course name in same brand blocked (Model level)');
        }

        // 4. Create same Course Code/Name in Brand B (should succeed)
        const courseB1 = await Course.create({
            courseCode: 'C101',
            courseName: 'Course 101',
            duration: 10,
            singleShotFee: 1000,
            normalFee: 1200,
            brand: brandB
        });
        console.log('SUCCESS: Created same Course C101 in Brand B');

        console.log('\n--- Testing Course Category Uniqueness ---');

        // 1. Create Category in Brand A
        const catA1 = await CourseCategory.create({
            name: 'Cat 1',
            brand: brandA
        });
        console.log('Created Category Cat 1 in Brand A');

        // 2. Duplicate in Brand A (should fail)
        try {
            await CourseCategory.create({
                name: 'Cat 1',
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate category in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate category in same brand blocked');
        }

        // 3. Same in Brand B (should succeed)
        await CourseCategory.create({
            name: 'Cat 1',
            brand: brandB
        });
        console.log('SUCCESS: Created same Category Cat 1 in Brand B');

        console.log('\n--- Testing Campaign Uniqueness ---');

        // 1. Create Campaign in Brand A
        const campA1 = await Campaign.create({
            name: 'Promo 1',
            value: 'promo-1',
            brand: brandA
        });
        console.log('Created Campaign Promo 1 in Brand A');

        // 2. Duplicate in Brand A (should fail)
        try {
            await Campaign.create({
                name: 'Promo 1',
                value: 'promo-1-other',
                brand: brandA
            });
            console.error('FAIL: Should not be able to create duplicate campaign name in same brand');
        } catch (err) {
            console.log('SUCCESS: Duplicate campaign name in same brand blocked');
        }

        // 3. Same in Brand B (should succeed)
        await Campaign.create({
            name: 'Promo 1',
            value: 'promo-1',
            brand: brandB
        });
        console.log('SUCCESS: Created same Campaign Promo 1 in Brand B');

        // Cleanup
        await Course.deleteMany({ brand: { $in: [brandA, brandB] } });
        await CourseCategory.deleteMany({ brand: { $in: [brandA, brandB] } });
        await Campaign.deleteMany({ brand: { $in: [brandA, brandB] } });
        console.log('\nCleanup complete');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
