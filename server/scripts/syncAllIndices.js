import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContactPoint from '../model/contactPointModel.js';
import Course from '../model/courseModel.js';
import CourseCategory from '../model/courseCategoryModel.js';
import Campaign from '../model/campaignModel.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamcrm';

async function syncAll() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const models = [
            { name: 'ContactPoint', model: ContactPoint },
            { name: 'Course', model: Course },
            { name: 'CourseCategory', model: CourseCategory },
            { name: 'Campaign', model: Campaign }
        ];

        for (const { name, model } of models) {
            console.log(`\nSyncing indices for ${name}...`);
            try {
                // This will drop indices that are no longer in the schema and create new ones
                await model.syncIndexes();
                console.log(`Successfully synced indices for ${name}`);
            } catch (err) {
                console.error(`Error syncing indices for ${name}:`, err.message);
                if (err.code === 26) {
                    console.log(`Collection for ${name} does not exist yet. Creating a dummy document to initialize collection...`);
                    const dummy = new model({ brand: new mongoose.Types.ObjectId(), name: 'Initial', courseCode: 'INIT', courseName: 'Initial' });
                    // Handle model specific required fields
                    if (name === 'ContactPoint') {
                        dummy.value = 'initial';
                    }
                    if (name === 'Course') {
                        dummy.duration = 1;
                        dummy.singleShotFee = 0;
                        dummy.normalFee = 0;
                    }

                    try {
                        await dummy.save();
                        await model.deleteOne({ _id: dummy._id });
                        await model.syncIndexes();
                        console.log(`Collection initialized and indices synced for ${name}`);
                    } catch (saveErr) {
                        console.error(`Could not initialize collection for ${name}:`, saveErr.message);
                    }
                }
            }

            console.log(`Current indices for ${name}:`);
            try {
                const indices = await model.collection.getIndexes();
                console.log(JSON.stringify(indices, null, 2));
            } catch (err) {
                console.log(`Could not fetch indices for ${name}: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

syncAll();
