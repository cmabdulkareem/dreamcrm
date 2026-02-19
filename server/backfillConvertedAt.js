import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const backfill = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const customers = db.collection('customers');

        const allConverted = await customers.find({ leadStatus: 'converted' }).toArray();
        console.log(`Found ${allConverted.length} converted leads in database`);

        let updatedCount = 0;
        for (const lead of allConverted) {
            if (lead.convertedAt) {
                console.log(`Skipping ${lead.fullName} (already has convertedAt)`);
                continue;
            }

            let convertedAt = null;
            if (lead.remarks && lead.remarks.length > 0) {
                const conversionRemark = lead.remarks.find(r =>
                    r.leadStatus === 'converted' || r.remark?.includes('Admission taken')
                );
                if (conversionRemark && conversionRemark.updatedOn) {
                    convertedAt = conversionRemark.updatedOn;
                }
            }

            if (!convertedAt) {
                convertedAt = lead.createdAt;
            }

            await customers.updateOne({ _id: lead._id }, { $set: { convertedAt: convertedAt } });
            console.log(`Updated ${lead.fullName} with convertedAt: ${convertedAt}`);
            updatedCount++;
        }

        console.log(`Backfill complete. Updated ${updatedCount} leads.`);
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
};

backfill();
