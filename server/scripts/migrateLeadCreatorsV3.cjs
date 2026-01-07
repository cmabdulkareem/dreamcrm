
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const customerSchema = new mongoose.Schema({
    fullName: String,
    remarks: [{
        handledBy: String,
        updatedOn: Date
    }],
    createdBy: mongoose.Schema.Types.ObjectId,
    assignedBy: mongoose.Schema.Types.ObjectId,
    assignedTo: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    fullName: String
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase().trim();
};

const run = async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const users = await User.find({}, 'fullName');
        const userMap = new Map();
        users.forEach(u => {
            userMap.set(normalizeName(u.fullName), u._id);
        });

        // Rabiya Jumana mapping
        const rabiyaId = userMap.get(normalizeName("Rabiya Jumana"));
        if (rabiyaId) {
            userMap.set(normalizeName("Fathimath Rabiya Jumana MM"), rabiyaId);
        }

        const leads = await Customer.find({});
        console.log(`Processing ${leads.length} leads...`);

        let updated = 0;
        for (const lead of leads) {
            let creatorId = null;
            if (lead.remarks && lead.remarks.length > 0) {
                const firstHandledBy = lead.remarks[0].handledBy;
                creatorId = userMap.get(normalizeName(firstHandledBy));

                if (!creatorId && firstHandledBy) {
                    const norm = normalizeName(firstHandledBy);
                    for (const [name, id] of userMap.entries()) {
                        if (name.includes(norm) || norm.includes(name)) {
                            creatorId = id;
                            break;
                        }
                    }
                }
            }

            if (!creatorId) creatorId = lead.assignedBy || lead.assignedTo;

            if (creatorId && creatorId.toString() !== lead.createdBy?.toString()) {
                lead.createdBy = creatorId;
                await lead.save();
                updated++;
            }
        }

        console.log(`Done. Updated ${updated} leads.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
