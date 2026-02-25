import CallList from '../model/callListModel.js';
import mongoose from 'mongoose';
import { isOwner, isManager } from '../utils/roleHelpers.js';

// Helper to cast fields to ObjectId for aggregation
const castQueryForAggregation = (query) => {
    if (query === null || typeof query !== 'object') return query;
    if (query instanceof mongoose.Types.ObjectId) return query;
    if (query instanceof RegExp || query instanceof Date) return query;

    if (Array.isArray(query)) {
        return query.map(item => castQueryForAggregation(item));
    }

    const casted = {};
    for (const key in query) {
        const value = query[key];
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            casted[key] = new mongoose.Types.ObjectId(value);
        } else if (typeof value === 'object' && value !== null) {
            casted[key] = castQueryForAggregation(value);
        } else {
            casted[key] = value;
        }
    }
    return casted;
};

// Get all call lists with pagination and advanced filtering
export const getAllCallLists = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search,
            startDate,
            endDate,
            creator,
            assignedTo: filterAssignedTo,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitInt = parseInt(limit);

        const brandFilter = req.brandFilter || {};

        // 1. Role-based base query restriction (Security)
        const { hasRole } = await import("../utils/roleHelpers.js");
        const headerBrandId = req.headers['x-brand-id'];
        const isACRole = hasRole(req.user, "Academic Coordinator", headerBrandId);

        let baseQuery = { ...brandFilter };
        if ((!isOwner(req.user, headerBrandId) && !isManager(req.user, headerBrandId)) || isACRole) {
            baseQuery.$or = [
                { assignedTo: req.user.id },
                { createdBy: req.user.id }
            ];
        }

        // 2. Build statsQuery: Only based on selected date range (plus brand/security)
        const statsQuery = { ...baseQuery };
        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.$lte = end;
            }
            statsQuery.createdAt = dateQuery;
        }

        // 3. Build finalQuery for table: includes statsQuery + fine-grained filters
        let finalQuery = { ...statsQuery };
        const otherFilters = [];

        if (creator) {
            otherFilters.push({ createdBy: creator });
        }

        if (filterAssignedTo) {
            if (filterAssignedTo === 'unassigned') {
                otherFilters.push({ assignedTo: null });
            } else {
                otherFilters.push({ assignedTo: filterAssignedTo });
            }
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            otherFilters.push({
                $or: [
                    { name: searchRegex },
                    { phoneNumber: searchRegex },
                    { socialMediaId: searchRegex },
                    { remarks: searchRegex },
                    { source: searchRegex },
                    { purpose: searchRegex }
                ]
            });
        }

        if (status) {
            otherFilters.push({ status });
        }

        if (otherFilters.length > 0) {
            finalQuery = {
                $and: [
                    finalQuery,
                    ...otherFilters
                ]
            };
        }

        const totalItems = await CallList.countDocuments(finalQuery);
        const callLists = await CallList.find(finalQuery)
            .populate('createdBy', 'fullName')
            .populate('assignedTo', 'fullName')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limitInt);

        return res.status(200).json({
            callLists,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limitInt),
                currentPage: parseInt(page),
                limit: limitInt
            },
            stats: await CallList.aggregate([
                { $match: castQueryForAggregation(statsQuery) },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        });
    } catch (error) {
        console.error("Error fetching call lists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new call list entry
export const createCallList = async (req, res) => {
    try {
        const { name, phoneNumber, socialMediaId, remarks, assignedTo, source, purpose } = req.body;

        const brandId = req.headers['x-brand-id'];
        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required in headers." });
        }

        // At least one field should be provided (except remarks)
        if (!name && !phoneNumber && !socialMediaId) {
            return res.status(400).json({ message: "At least one field (Name, Phone, or Social Media ID) must be provided." });
        }

        if (phoneNumber) {
            const existingEntry = await CallList.findOne({ phoneNumber, brand: brandId });
            if (existingEntry) {
                return res.status(400).json({ message: `A call list entry with phone number ${phoneNumber} already exists.` });
            }
        }

        const newCallList = new CallList({
            name: name || '',
            phoneNumber: phoneNumber || '',
            socialMediaId: socialMediaId || '',
            remarks: remarks || '',
            source: source || '',
            purpose: purpose || '',
            brand: brandId,
            createdBy: req.user.id,
            // If assignedTo is not provided, default to the creator
            assignedTo: assignedTo || req.user.id
        });

        await newCallList.save();

        // Populate for response
        await newCallList.populate([
            { path: 'createdBy', select: 'fullName' },
            { path: 'assignedTo', select: 'fullName' }
        ]);

        return res.status(201).json({
            message: "Call list entry created successfully.",
            callList: newCallList
        });
    } catch (error) {
        console.error("Error creating call list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update call list entry
export const updateCallList = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phoneNumber, socialMediaId, remarks, assignedTo, source, purpose } = req.body;

        // At least one field (excluding remarks) must be present
        if (!name && !phoneNumber && !socialMediaId) {
            return res.status(400).json({ message: "At least one field (Name, Phone, or Social Media ID) must be provided." });
        }

        const query = { _id: id, ...req.brandFilter };
        const existingCallList = await CallList.findOne(query);

        if (!existingCallList) {
            return res.status(404).json({ message: "Call list entry not found." });
        }

        // Check if phone number is being changed to an existing one
        if (phoneNumber && phoneNumber !== existingCallList.phoneNumber) {
            const duplicateEntry = await CallList.findOne({
                phoneNumber,
                brand: existingCallList.brand,
                _id: { $ne: id }
            });
            if (duplicateEntry) {
                return res.status(400).json({ message: `A call list entry with phone number ${phoneNumber} already exists.` });
            }
        }

        const updateData = {
            name: name || '',
            phoneNumber: phoneNumber || '',
            socialMediaId: socialMediaId || '',
            remarks: remarks || '',
            source: source || '',
            purpose: purpose || '',
            assignedTo: assignedTo || null
        };

        const updatedCallList = await CallList.findOneAndUpdate(
            query,
            updateData,
            { new: true }
        ).populate([
            { path: 'createdBy', select: 'fullName' },
            { path: 'assignedTo', select: 'fullName' }
        ]);

        if (!updatedCallList) {
            return res.status(404).json({ message: "Call list entry not found." });
        }

        return res.status(200).json({
            message: "Call list entry updated successfully.",
            callList: updatedCallList
        });
    } catch (error) {
        console.error("Error updating call list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete call list entry (owner only)
export const deleteCallList = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is owner or manager
        const brandId = req.headers['x-brand-id'];
        if (!isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            return res.status(403).json({ message: "Only owners and managers can delete call list entries." });
        }

        const query = { _id: id, ...req.brandFilter };
        const callList = await CallList.findOneAndDelete(query);
        if (!callList) {
            return res.status(404).json({ message: "Call list entry not found." });
        }

        return res.status(200).json({ message: "Call list entry deleted successfully." });
    } catch (error) {
        console.error("Error deleting call list:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Import multiple call list entries
export const importCallLists = async (req, res) => {
    try {
        const { entries } = req.body;
        const brandId = req.headers['x-brand-id'];

        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required in headers." });
        }

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ message: "No entries provided for import." });
        }

        const validEntries = [];
        const skippedEntries = [];
        const seenPhoneNumbers = new Set();

        // Get existing phone numbers for this brand to check against
        const existingEntries = await CallList.find({ brand: brandId, phoneNumber: { $ne: "" } }).select('phoneNumber');
        const existingPhoneNumbers = new Set(existingEntries.map(e => e.phoneNumber));

        for (const entry of entries) {
            const { name, phoneNumber, socialMediaId, source, purpose, remarks } = entry;

            // At least one identifying or data field (excluding remarks) must be present
            if (!name && !phoneNumber && !socialMediaId && !source && !purpose) {
                skippedEntries.push({ entry, reason: "Missing data (Name, Phone, Social Media ID, Source, or Purpose)" });
                continue;
            }

            // Check for duplicates in the import file itself
            if (phoneNumber && seenPhoneNumbers.has(phoneNumber)) {
                skippedEntries.push({ entry, reason: `Duplicate phone number within import: ${phoneNumber}` });
                continue;
            }

            // Check for duplicates in the database
            if (phoneNumber && existingPhoneNumbers.has(phoneNumber)) {
                skippedEntries.push({ entry, reason: `Phone number already exists: ${phoneNumber}` });
                continue;
            }

            if (phoneNumber) {
                seenPhoneNumbers.add(phoneNumber);
            }

            validEntries.push({
                name: name || '',
                phoneNumber: phoneNumber || '',
                socialMediaId: socialMediaId || '',
                source: source || '',
                purpose: purpose || '',
                remarks: remarks || '',
                status: entry.status || 'pending',
                brand: brandId,
                createdBy: req.user.id
            });
        }

        if (validEntries.length === 0) {
            return res.status(400).json({
                message: "No valid or new entries found to import.",
                skippedCount: skippedEntries.length,
                skippedEntries
            });
        }

        const createdEntries = await CallList.insertMany(validEntries);

        return res.status(201).json({
            message: `Successfully imported ${createdEntries.length} entries.`,
            importedCount: createdEntries.length,
            skippedCount: skippedEntries.length,
            skippedEntries
        });
    } catch (error) {
        console.error("Error importing call lists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update status of a call list entry
export const updateCallListStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required." });
        }

        const query = { _id: id, ...req.brandFilter };
        const updatedCallList = await CallList.findOneAndUpdate(
            query,
            { status },
            { new: true }
        ).populate([
            { path: 'createdBy', select: 'fullName' },
            { path: 'assignedTo', select: 'fullName' }
        ]);

        if (!updatedCallList) {
            return res.status(404).json({ message: "Call list entry not found." });
        }

        return res.status(200).json({
            message: "Status updated successfully.",
            callList: updatedCallList
        });
    } catch (error) {
        console.error("Error updating call list status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// Bulk assign call list entries
export const bulkAssignCallLists = async (req, res) => {
    try {
        const { ids, assignedTo } = req.body;
        const brandId = req.headers['x-brand-id'];

        if (!isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            return res.status(403).json({ message: "Only owners and managers can bulk assign call lists." });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No entries selected for assignment." });
        }

        const { source, purpose } = req.body;

        // Construct update object dynamically
        const updateData = {};

        // Handle assignment (allow unassign with null/empty string if explicitly passed, usually 'unassign' string from frontend)
        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo === 'unassign' ? null : assignedTo;
        }

        // Handle source and purpose updates if provided
        if (source !== undefined && source !== null && source.trim() !== '') {
            updateData.source = source.trim();
        }

        if (purpose !== undefined && purpose !== null && purpose.trim() !== '') {
            updateData.purpose = purpose.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields provided to update." });
        }

        // Ensure we only update items in the current brand's context
        const query = {
            ...req.brandFilter,
            _id: { $in: ids }
        };

        const result = await CallList.updateMany(
            query,
            { $set: updateData }
        );

        return res.status(200).json({
            message: `Successfully assigned ${result.modifiedCount} entries.`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error bulk assigning call lists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Bulk delete call list entries
export const bulkDeleteCallLists = async (req, res) => {
    try {
        const { ids } = req.body;
        const brandId = req.headers['x-brand-id'];

        if (!isOwner(req.user, brandId) && !isManager(req.user, brandId)) {
            return res.status(403).json({ message: "Only owners and managers can bulk delete call lists." });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No entries selected for deletion." });
        }

        // Ensure we only delete items in the current brand's context
        const query = {
            ...req.brandFilter,
            _id: { $in: ids }
        };

        const result = await CallList.deleteMany(query);

        return res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} entries.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting call lists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
