import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server directory
config({ path: path.join(__dirname, 'server/.env') });

import Event from './server/model/eventModel.js';

async function diag() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const link = '2e2831525b76a89cb6602bba86a194c9';
        console.log(`Searching for event with link: ${link}`);

        const event = await Event.findOne({ registrationLink: link }).lean();

        if (event) {
            console.log('FOUND EVENT:');
            console.log(JSON.stringify(event, null, 2));
        } else {
            console.log('EVENT NOT FOUND.');

            // Check all events to see link format
            const allEvents = await Event.find({}, { eventName: 1, registrationLink: 1 }).limit(5).lean();
            console.log('Recent events in DB:');
            console.log(JSON.stringify(allEvents, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

diag();
