import studentModel from "../model/studentModel.js";
import Brand from "../model/brandModel.js";

/**
 * Generate Student ID in format: BRANDCODEYYMMDDSerial
 * Example: ABC251230001
 * 
 * @param {String} brandId - The brand ObjectId
 * @param {Date} enrollmentDate - The enrollment date
 * @returns {Promise<String>} - Generated student ID
 */
export const generateStudentId = async (brandId, enrollmentDate) => {
    try {
        // Fetch brand to get the code
        const brand = await Brand.findById(brandId);
        if (!brand) {
            throw new Error("Brand not found");
        }

        const brandCode = brand.code; // Already uppercase from model

        // Format date as YYMMDD
        const date = new Date(enrollmentDate);
        const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (01-12)
        const day = String(date.getDate()).padStart(2, '0'); // Day (01-31)
        const dateStr = `${year}${month}${day}`;

        // Get start and end of the enrollment date for querying
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Find all students created on the same date with the same brand
        // Student IDs follow pattern: BRANDCODEYYMMDDSerial
        const prefix = `${brandCode}${dateStr}`;

        // Query students with matching brand and enrollment date
        const studentsOnSameDay = await studentModel.find({
            brand: brandId,
            enrollmentDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ studentId: -1 }); // Sort by studentId descending to get the latest

        let nextSerial = 1;

        if (studentsOnSameDay.length > 0) {
            // Extract serial numbers from existing student IDs with the same prefix
            const serialNumbers = studentsOnSameDay
                .map(student => {
                    if (student.studentId && student.studentId.startsWith(prefix)) {
                        const serialPart = student.studentId.slice(prefix.length);
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

        // Generate final student ID
        const studentId = `${prefix}${serialStr}`;

        return studentId;
    } catch (error) {
        console.error("Error generating student ID:", error);
        throw error;
    }
};
