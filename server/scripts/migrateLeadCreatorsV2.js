
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

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

const migrateCreatorsV2 = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Fetching all users for name mapping...");
        const users = await User.find({}, 'fullName');
        const userMap = new Map();
        users.forEach(u => {
            userMap.set(normalizeName(u.fullName), u._id);
        });

        // Handle specific mapping for Fathimath Rabiya Jumana MM -> Rabiya Jumana (695381e72885ff1f9253f81a)
        const rabiyaId = userMap.get(normalizeName("Rabiya Jumana"));
        if (rabiyaId) {
            userMap.set(normalizeName("Fathimath Rabiya Jumana MM"), rabiyaId);
        }

        console.log("Processing leads...");
        const leads = await Customer.find({});
        console.log(`Found ${leads.length} leads.`);

        let updatedCount = 0;
        let matchedByName = 0;
        let fallbackUsed = 0;

        for (const lead of leads) {
            let creatorId = null;

            // Strategy 1: Look at the first remark's handledBy
            if (lead.remarks && lead.remarks.length > 0) {
                const firstRemarkHandledBy = lead.remarks[0].handledBy;
                const normalizedSearch = normalizeName(firstRemarkHandledBy);

                creatorId = userMap.get(normalizedSearch);

                if (!creatorId && normalizedSearch) {
                    // Fuzzy match
                    for (const [name, id] of userMap.entries()) {
                        if (name.includes(normalizedSearch) || normalizedSearch.includes(name)) {
                            creatorId = id;
                            break;
                        }
                    }
                }

                if (creatorId) matchedByName++;
            }

            // Strategy 2: Fallback to assignedBy if still no creator
            if (!creatorId) {
                creatorId = lead.assignedBy || lead.assignedTo;
                if (creatorId) fallbackUsed++;
            }

            if (creatorId && creatorId.toString() !== lead.createdBy?.toString()) {
                lead.createdBy = creatorId;
                await lead.save();
                updatedCount++;
            }

            if (matchedByName + fallbackUsed % 50 === 0) {
                process.stdout.write(`\rProgress: ${matchedByName + fallbackUsed}/${leads.length}`);
            }
        }

        console.log(`\nMigration V2 complete. Updated ${updatedCount} leads.`);
        console.log(`Stats: Matched by name: ${matchedByName}, Fallbacks: ${fallbackUsed}`);
        process.exit(0);
    } catch (error) {
        console.error("Migration V2 failed:", error);
        process.exit(1);
    }
};

migrateCreatorsV2();
