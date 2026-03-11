
import mongoose from 'mongoose';
import './config/db.js';
import Event from './model/eventModel.js';

async function checkEvent() {
  const link = '2e2831525b76a89cb602bba86a194c9';
  console.log('--- DIAGNOSTIC START ---');
  console.log('Checking link:', link);
  
  try {
    const event = await Event.findOne({ registrationLink: link });
    if (!event) {
      console.log('RESULT: EVENT_NOT_FOUND');
    } else {
      console.log('RESULT: EVENT_FOUND');
      console.log('ID:', event._id);
      console.log('Name:', event.eventName);
      console.log('IsActive:', event.isActive);
    }
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    console.log('--- DIAGNOSTIC END ---');
    process.exit();
  }
}

checkEvent();
