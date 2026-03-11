import './config/db.js';
import eventModel from './model/eventModel.js';

async function findEvent() {
    const event = await eventModel.findOne({ isActive: true });
    if (event) {
        console.log("EVENT_LINK:" + event.registrationLink);
        console.log("EVENT_NAME:" + event.eventName);
    } else {
        console.log("NO_ACTIVE_EVENT");
    }
    process.exit(0);
}

findEvent();
