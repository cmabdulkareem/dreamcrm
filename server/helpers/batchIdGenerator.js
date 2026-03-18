import Batch from "../model/batchModel.js";
import Brand from "../model/brandModel.js";

/**
 * Generate Batch ID in format: BAT-BRANDCODE-YYMMDD-Serial
 * Example: BAT-ABC-251230-001
 * 
 * @param {String} brandId - The brand ObjectId
 * @param {Date} startDate - The batch start date
 * @returns {Promise<String>} - Generated batch ID
 */
export const generateBatchId = async (brandId, startDate) => {
    try {
        // Fetch brand to get the code
        const brand = await Brand.findById(brandId);
        if (!brand) {
            throw new Error("Brand not found");
        }

        const brandCode = brand.code; // Already uppercase from model

        // Format date as YYMMDD
        const date = new Date(startDate);
        const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (01-12)
        const day = String(date.getDate()).padStart(2, '0'); // Day (01-31)
        const dateStr = `${year}${month}${day}`;

        const prefix = `BAT-${brandCode}-${dateStr}`;

        // Get start and end of the day for querying (optional if we just use prefix matching)
        // However, for batches, we typically want to find the latest serial for that brand and day
        
        // Find all batches created on the same day with the same brand prefix
        const batchesOnSameDay = await Batch.find({
            brand: brandId,
            batchName: new RegExp(`^${prefix}-`)
        }).sort({ batchName: -1 });

        let nextSerial = 1;

        if (batchesOnSameDay.length > 0) {
            const serialNumbers = batchesOnSameDay
                .map(batch => {
                    if (batch.batchName && batch.batchName.startsWith(prefix)) {
                        const parts = batch.batchName.split('-');
                        const serialPart = parts[parts.length - 1];
                        return parseInt(serialPart, 10);
                    }
                    return 0;
                })
                .filter(num => !isNaN(num) && num > 0);

            if (serialNumbers.length > 0) {
                const maxSerial = Math.max(...serialNumbers);
                nextSerial = maxSerial + 1;
            }
        }

        // Format serial as 3-digit number (001, 002, etc.)
        const serialStr = String(nextSerial).padStart(3, '0');

        // Generate final batch ID
        const batchId = `${prefix}-${serialStr}`;

        return batchId;
    } catch (error) {
        console.error("Error generating batch ID:", error);
        throw error;
    }
};
