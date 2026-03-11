
import mongoose from 'mongoose';
import './config/db.js';
import Event from './model/eventModel.js';

async function listLinks() {
  console.log('--- EVENT LINKS ---');
  try {
    const events = await Event.find({}, 'eventName registrationLink isActive');
    events.forEach(e => {
      console.log(`Link: ${e.registrationLink} | Name: ${e.eventName} | Active: ${e.isActive}`);
    });
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    console.log('--- END ---');
    process.exit();
  }
}

listLinks();
