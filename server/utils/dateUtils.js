/**
 * Utility functions for date calculations
 */

/**
 * Calculates the start and end of the Indian Financial Year (April 1 to March 31)
 * @param {Date} date - The date to calculate for (defaults to current date)
 * @returns {Object} { startDate, endDate }
 */
export const getFinancialYearRange = (date = new Date()) => {
    const currentMonth = date.getMonth(); // 0-indexed: 0=Jan, 3=Apr
    const currentYear = date.getFullYear();

    let startYear = currentYear;
    if (currentMonth < 3) { // Jan, Feb, Mar (0, 1, 2)
        startYear = currentYear - 1;
    }

    // April 1st of the start year
    const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0));

    // March 31st of the following year
    const endDate = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999));

    return { startDate, endDate };
};
