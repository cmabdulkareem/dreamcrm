/**
 * Debug: check Kasaragod brand campaigns specifically
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const Brand = mongoose.model('Brand', new mongoose.Schema({
    name: String,
    code: String,
    campaigns: [{
        name: String, value: String,
        discountPercentage: Number, cashback: Number, isActive: Boolean
    }],
    contactPoints: [{ name: String, value: String, isActive: Boolean }],
    courses: [{ courseCode: String, courseName: String }],
}));

async function check() {
    await mongoose.connect(MONGO_URI);

    // Find by name containing Kasaragod
    const brands = await Brand.find({ name: { $regex: /kasaragod/i } });
    if (brands.length === 0) {
        console.log('No Kasaragod brand found! All brands:');
        const all = await Brand.find({}, 'name code');
        all.forEach(b => console.log(`  - "${b.name}" (${b.code}) = ${b._id}`));
    } else {
        for (const b of brands) {
            console.log(`\n=== Brand: "${b.name}" (${b.code}) ===`);
            console.log(`_id: ${b._id}`);
            console.log(`\ncampaigns (${b.campaigns.length}):`);
            b.campaigns.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} | active: ${c.isActive}`));
            console.log(`\ncontactPoints (${b.contactPoints.length}):`);
            b.contactPoints.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));
            console.log(`\ncourses (${b.courses.length}):`);
            b.courses.forEach((c, i) => console.log(`  ${i + 1}. ${c.courseName}`));
        }
    }

    await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
