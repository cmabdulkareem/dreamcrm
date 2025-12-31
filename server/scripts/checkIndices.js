import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContactPoint from '../model/contactPointModel.js';
import Course from '../model/courseModel.js';
import CourseCategory from '../model/courseCategoryModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function checkIndices() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        console.log('\n--- ContactPoint Indices ---');
        console.log(JSON.stringify(await ContactPoint.collection.getIndexes(), null, 2));

        console.log('\n--- Course Indices ---');
        console.log(JSON.stringify(await Course.collection.getIndexes(), null, 2));

        console.log('\n--- CourseCategory Indices ---');
        console.log(JSON.stringify(await CourseCategory.collection.getIndexes(), null, 2));

    } catch (error) {
        console.error('Error checking indices:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndices();
