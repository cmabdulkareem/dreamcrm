import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerModel from './model/customerModel.js';

dotenv.config();

const backfill = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const convertedLeads = await customerModel.find({
            leadStatus: 'converted',
            convertedAt: { $exists: false }
        });

        console.log(`Found ${convertedLeads.length} converted leads to backfill`);

        for (const lead of convertedLeads) {
            // Find the conversion remark
            const conversionRemark = lead.remarks.find(r =>
                r.leadStatus === 'converted' || r.remark?.includes('Admission taken')
            );

            if (conversionRemark) {
                lead.convertedAt = conversionRemark.updatedOn;
                await lead.save();
                console.log(`Backfilled convertedAt for lead: ${lead.fullName} (${lead.convertedAt})`);
            } else {
                // Fallback to createdAt if no remark found
                lead.convertedAt = lead.createdAt;
                await lead.save();
                console.log(`Fallback backfill (createdAt) for lead: ${lead.fullName}`);
            }
        }

        console.log('Backfill complete');
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
};

backfill();
