import CallList from '../model/callListModel.js';
import { isOwner, isManager } from '../utils/roleHelpers.js';

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
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitInt = parseInt(limit);

        const brandFilter = req.brandFilter || {};
        let finalQuery = { ...brandFilter };

        // Role-based base query restriction WITHIN the brand
        const { hasRole } = await import("../utils/roleHelpers.js");
        const isACRole = hasRole(req.user, "Academic Coordinator");

        if ((!isOwner(req.user) && !isManager(req.user)) || isACRole) {
            finalQuery = {
                ...brandFilter,
                $or: [
                    { assignedTo: req.user.id },
                    { createdBy: req.user.id }
                ]
            };
        }

        // Apply additional filters
        const filters = [];

        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.$lte = end;
            }
            filters.push({ createdAt: dateQuery });
        }

        if (creator) {
            filters.push({ createdBy: creator });
        }

        if (filterAssignedTo) {
            if (filterAssignedTo === 'unassigned') {
                filters.push({ assignedTo: null });
            } else {
                filters.push({ assignedTo: filterAssignedTo });
            }
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filters.push({
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

        if (filters.length > 0) {
            // Combine role-based query with filters
            finalQuery = {
                $and: [
                    finalQuery,
                    ...filters
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
            }
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

        const updateData = {
            name: name || '',
            phoneNumber: phoneNumber || '',
            socialMediaId: socialMediaId || '',
            remarks: remarks || '',
            source: source || '',
            purpose: purpose || '',
            assignedTo: assignedTo || null
        };

        const query = { _id: id, ...req.brandFilter };
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

        // Check if user is owner
        if (!isOwner(req.user)) {
            return res.status(403).json({ message: "Only owners can delete call list entries." });
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

        for (const entry of entries) {
            const { name, phoneNumber, socialMediaId, remarks } = entry;

            // At least one field (excluding remarks) must be present
            if (!name && !phoneNumber && !socialMediaId) {
                skippedEntries.push({ entry, reason: "Missing mandatory fields (Name, Phone, or Social Media ID)" });
                continue;
            }

            validEntries.push({
                name: name || '',
                phoneNumber: phoneNumber || '',
                socialMediaId: socialMediaId || '',
                remarks: remarks || '',
                status: entry.status || 'pending',
                brand: brandId,
                createdBy: req.user.id
            });
        }

        if (validEntries.length === 0) {
            return res.status(400).json({
                message: "No valid entries found to import.",
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

        if (!isOwner(req.user) && !isManager(req.user)) {
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
