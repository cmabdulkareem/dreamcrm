import CallList from '../model/callListModel.js';
import { isOwner, isManager } from '../utils/roleHelpers.js';

// Get all call lists for current user's brand with role-based filtering
export const getAllCallLists = async (req, res) => {
    try {
        let finalQuery = req.brandFilter || {};

        // If not Owner or Manager, only show entries assigned to them
        if (!isOwner(req.user) && !isManager(req.user)) {
            finalQuery.assignedTo = req.user.id;
        }

        const callLists = await CallList.find(finalQuery)
            .populate('createdBy', 'fullName')
            .populate('assignedTo', 'fullName')
            .sort({ createdAt: -1 });

        return res.status(200).json({ callLists });
    } catch (error) {
        console.error("Error fetching call lists:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create a new call list entry
export const createCallList = async (req, res) => {
    try {
        const { name, phoneNumber, socialMediaId, remarks, assignedTo } = req.body;

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
            brand: brandId,
            createdBy: req.user.id,
            assignedTo: assignedTo || null
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
        const { name, phoneNumber, socialMediaId, remarks, assignedTo } = req.body;

        // At least one field (excluding remarks) must be present
        if (!name && !phoneNumber && !socialMediaId) {
            return res.status(400).json({ message: "At least one field (Name, Phone, or Social Media ID) must be provided." });
        }

        const updateData = {
            name: name || '',
            phoneNumber: phoneNumber || '',
            socialMediaId: socialMediaId || '',
            remarks: remarks || '',
            assignedTo: assignedTo || null
        };

        const updatedCallList = await CallList.findByIdAndUpdate(
            id,
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

        const callList = await CallList.findByIdAndDelete(id);
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

        const updatedCallList = await CallList.findByIdAndUpdate(
            id,
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

        // assignedTo can be null (unassign) or a valid user ID
        const finalAssignedTo = assignedTo || null;

        // Ensure we only update items in the current brand's context
        const query = {
            ...req.brandFilter,
            _id: { $in: ids }
        };

        const result = await CallList.updateMany(
            query,
            { $set: { assignedTo: finalAssignedTo } }
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
