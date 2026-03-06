import mongoose from 'mongoose';
import './server/config/db.js';
import Customer from './server/model/customerModel.js';

async function checkLeads() {
    try {
        // List some leads to see if the field is there
        const leads = await Customer.find({ immediateFollowupAt: { $ne: null } })
            .select('fullName phone1 immediateFollowupAt immediateFollowupInterval leadStatus createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(5);

        console.log('Leads with immediate followup:');
        if (leads.length === 0) {
            console.log('No leads found with immediateFollowupAt set.');
            // Check last 5 updated leads regardless
            const lastLeads = await Customer.find({})
                .select('fullName phone1 immediateFollowupAt immediateFollowupInterval leadStatus updatedAt')
                .sort({ updatedAt: -1 })
                .limit(5);
            console.log('Last 5 updated leads:');
            console.log(JSON.stringify(lastLeads, null, 2));
        } else {
            console.log(JSON.stringify(leads, null, 2));
        }

        const now = new Date();
        console.log('Current server time (UTC):', now.toISOString());
        console.log('Current server TZ:', process.env.TZ);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkLeads();
