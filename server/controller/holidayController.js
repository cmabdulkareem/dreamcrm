import Holiday from '../model/holidayModel.js';
import { isAdmin, isOwner, isManager } from '../utils/roleHelpers.js';

export const getHolidays = async (req, res) => {
    try {
        const brandId = req.brandFilter?.brand || req.headers['x-brand-id'];
        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required." });
        }

        const { month, year } = req.query;
        let query = { brand: brandId };

        if (month && year) {
            const m = parseInt(month) - 1;
            const y = parseInt(year);
            const startDate = new Date(y, m, 1);
            const endDate = new Date(y, m + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const holidays = await Holiday.find(query).sort({ date: 1 });
        return res.status(200).json({ holidays });
    } catch (error) {
        console.error("Error fetching holidays:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addHoliday = async (req, res) => {
    try {
        const { date, reason } = req.body;
        const brandId = req.brandFilter?.brand || req.headers['x-brand-id'];
        const userId = req.user.id || req.user._id;

        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required." });
        }

        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            return res.status(403).json({ message: "Only administrators can add holidays." });
        }

        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);

        if (isNaN(holidayDate.getTime())) {
            return res.status(400).json({ message: "Invalid date provided." });
        }

        const holiday = await Holiday.findOneAndUpdate(
            { brand: brandId, date: holidayDate },
            {
                brand: brandId,
                date: holidayDate,
                reason,
                createdBy: userId
            },
            { upsert: true, new: true }
        );

        return res.status(201).json({ message: "Holiday added successfully.", holiday });
    } catch (error) {
        console.error("Error adding holiday:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        const brandId = req.headers['x-brand-id'];
        if (!isAdmin(req.user, brandId) && !isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            return res.status(403).json({ message: "Only administrators can delete holidays." });
        }

        const holiday = await Holiday.findByIdAndDelete(id);
        if (!holiday) {
            return res.status(404).json({ message: "Holiday not found." });
        }

        return res.status(200).json({ message: "Holiday deleted successfully." });
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
