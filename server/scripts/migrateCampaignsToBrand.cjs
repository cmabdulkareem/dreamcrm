/**
 * Migration: Campaigns → Brand.campaigns
 * Moves campaign documents from the old standalone 'campaigns' collection
 * into the embedded Brand.campaigns array.
 *
 * Run: node scripts/migrateCampaignsToBrand.cjs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
    console.error('No MONGO_URI found in .env');
    process.exit(1);
}

// ─── Schemas ────────────────────────────────────────────────────────────────
const campaignSchema = new mongoose.Schema({
    name: String,
    value: String,
    description: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    cashback: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
    name: String,
    code: String,
    campaigns: [campaignSchema],
}, { timestamps: true });

// Old Campaign model (the standalone collection)
const OldCampaign = mongoose.model('Campaign', new mongoose.Schema({
    name: String,
    value: String,
    description: String,
    discountPercentage: Number,
    cashback: Number,
    isActive: { type: Boolean, default: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
}, { timestamps: true }), 'campaigns'); // explicit collection name

const Brand = mongoose.model('Brand', brandSchema);

// ─── Migration ───────────────────────────────────────────────────────────────
async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const oldCampaigns = await OldCampaign.find({});
    console.log(`Found ${oldCampaigns.length} campaign(s) in old collection.`);

    if (oldCampaigns.length === 0) {
        console.log('Nothing to migrate. Exiting.');
        await mongoose.disconnect();
        return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const campaign of oldCampaigns) {
        if (!campaign.brand) {
            console.warn(`  ⚠  Campaign "${campaign.name}" has no brand — skipping.`);
            skipped++;
            continue;
        }

        const brand = await Brand.findById(campaign.brand);
        if (!brand) {
            console.warn(`  ⚠  Brand "${campaign.brand}" not found for campaign "${campaign.name}" — skipping.`);
            skipped++;
            continue;
        }

        // Check if already migrated
        const alreadyExists = brand.campaigns.some(c =>
            c.name === campaign.name || c.value === campaign.value
        );
        if (alreadyExists) {
            console.log(`  ℹ  Campaign "${campaign.name}" already in brand "${brand.name}" — skipping.`);
            skipped++;
            continue;
        }

        brand.campaigns.push({
            name: campaign.name,
            value: campaign.value || campaign.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            description: campaign.description || '',
            discountPercentage: campaign.discountPercentage || 0,
            cashback: campaign.cashback || 0,
            isActive: campaign.isActive !== undefined ? campaign.isActive : true,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
        });

        await brand.save();
        console.log(`  ✔  Migrated "${campaign.name}" → brand "${brand.name}"`);
        migrated++;
    }

    console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}`);
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
