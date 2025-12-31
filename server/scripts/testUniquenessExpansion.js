import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContactPoint from '../model/contactPointModel.js';
import Course from '../model/courseModel.js';
import CourseCategory from '../model/courseCategoryModel.js';
import Campaign from '../model/campaignModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function runTests() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const brandA = new mongoose.Types.ObjectId();
        const brandB = new mongoose.Types.ObjectId();

        const testCases = [
            {
                name: 'Course',
                model: Course,
                dataA: { courseCode: 'C101', courseName: 'Course 101', duration: 10, singleShotFee: 1000, normalFee: 1200, brand: brandA },
                duplicateData: { courseCode: 'C101', courseName: 'Other', duration: 5, singleShotFee: 500, normalFee: 600, brand: brandA },
                successDataB: { courseCode: 'C101', courseName: 'Course 101', duration: 10, singleShotFee: 1000, normalFee: 1200, brand: brandB }
            },
            {
                name: 'CourseCategory',
                model: CourseCategory,
                dataA: { name: 'Cat 1', brand: brandA },
                duplicateData: { name: 'Cat 1', brand: brandA },
                successDataB: { name: 'Cat 1', brand: brandB }
            },
            {
                name: 'Campaign',
                model: Campaign,
                dataA: { name: 'Promo 1', value: 'promo-1', brand: brandA },
                duplicateData: { name: 'Promo 1', value: 'promo-1-other', brand: brandA },
                successDataB: { name: 'Promo 1', value: 'promo-1', brand: brandB }
            },
            {
                name: 'ContactPoint',
                model: ContactPoint,
                dataA: { name: 'CP 1', value: 'cp-1', brand: brandA },
                duplicateData: { name: 'CP 1', value: 'cp-1-other', brand: brandA },
                successDataB: { name: 'CP 1', value: 'cp-1', brand: brandB }
            }
        ];

        for (const tc of testCases) {
            console.log(`\n--- Testing ${tc.name} Uniqueness ---`);

            // 1. Create in Brand A
            await tc.model.create(tc.dataA);
            console.log(`SUCCESS: Created ${tc.name} in Brand A`);

            // 2. Try duplicate in Brand A
            try {
                await tc.model.create(tc.duplicateData);
                console.error(`FAIL: Should not be able to create duplicate ${tc.name} in same brand`);
            } catch (err) {
                console.log(`SUCCESS: Duplicate ${tc.name} in same brand blocked`);
            }

            // 3. Create same in Brand B
            await tc.model.create(tc.successDataB);
            console.log(`SUCCESS: Created same ${tc.name} in Brand B (Different brand)`);
        }

        // Cleanup
        for (const tc of testCases) {
            await tc.model.deleteMany({ brand: { $in: [brandA, brandB] } });
        }
        console.log('\nCleanup complete');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
