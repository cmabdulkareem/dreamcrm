
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Customer = mongoose.model('Customer', new mongoose.Schema({
    fullName: String,
    remarks: [{
        handledBy: String,
        updatedOn: Date
    }],
    createdBy: mongoose.Schema.Types.ObjectId,
    assignedBy: mongoose.Schema.Types.ObjectId,
    assignedTo: mongoose.Schema.Types.ObjectId
}));

const User = mongoose.model('User', new mongoose.Schema({
    fullName: String
}));

async function run() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const users = await User.find({}, 'fullName');
        const userMap = {};
        users.forEach(u => {
            userMap[u.fullName.toLowerCase().trim()] = u._id;
        });

        // Manual mapping for the reported case
        const rabiyaId = userMap["rabiya jumana"];
        if (rabiyaId) {
            userMap["fathimath rabiya jumana mm"] = rabiyaId;
        }

        const leads = await Customer.find({});
        console.log(`Processing ${leads.length} leads...`);

        let count = 0;
        for (const lead of leads) {
            let creatorId = null;
            if (lead.remarks && lead.remarks.length > 0) {
                const firstHandledBy = lead.remarks[0].handledBy?.toLowerCase().trim();
                creatorId = userMap[firstHandledBy];

                if (!creatorId && firstHandledBy) {
                    for (const name in userMap) {
                        if (name.includes(firstHandledBy) || firstHandledBy.includes(name)) {
                            creatorId = userMap[name];
                            break;
                        }
                    }
                }
            }

            if (!creatorId) creatorId = lead.assignedBy || lead.assignedTo;

            if (creatorId) {
                lead.createdBy = creatorId;
                await lead.save();
                count++;
            }
        }

        console.log(`Finished. Updated ${count} leads.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
