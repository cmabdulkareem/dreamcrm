const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const UserSchema = new mongoose.Schema({
            email: String,
            isAdmin: { type: Boolean, default: false },
            brands: [{
                roles: [String]
            }]
        }, { timestamps: true });

        const User = mongoose.model('User', UserSchema);

        // Find users who have isAdmin: true but should not
        // We exclude known system admins
        const systemAdmins = ['cmabdulkareem@gmail.com', 'admin@caddclub.com'];

        const result = await User.updateMany(
            {
                email: { $nin: systemAdmins },
                isAdmin: true,
                brands: { $elemMatch: { roles: 'Owner' } }
            },
            { $set: { isAdmin: false } }
        );

        console.log(`Updated ${result.modifiedCount} users to remove global isAdmin status.`);

        // Also check if any other admins exist that aren't Owners or System Admins
        const otherAdmins = await User.find({
            email: { $nin: systemAdmins },
            isAdmin: true
        });

        if (otherAdmins.length > 0) {
            console.log('Other global admins still exist:', otherAdmins.map(u => u.email));
        }

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
