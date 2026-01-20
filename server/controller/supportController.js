import Support from '../model/supportModel.js';
import { isOwner, isManager, isDeveloper } from '../utils/roleHelpers.js';

// Create a new support request
export const createSupportRequest = async (req, res) => {
    try {
        const { title, description, type, priority } = req.body;
        const brandId = req.headers['x-brand-id'];

        if (!brandId) {
            return res.status(400).json({ message: "Brand ID is required." });
        }

        const newRequest = new Support({
            title,
            description,
            type,
            priority,
            brand: brandId,
            createdBy: req.user.id
        });

        await newRequest.save();
        await newRequest.populate('createdBy', 'fullName');

        res.status(201).json({
            message: "Request submitted successfully.",
            support: newRequest
        });
    } catch (error) {
        console.error("Error creating support request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all requests for the brand (with role-based filtering if needed)
export const getAllSupportRequests = async (req, res) => {
    try {
        let brandFilter = req.brandFilter || {};

        // Developer sees everything across all brands
        if (isDeveloper(req.user)) {
            brandFilter = {};
        }

        // All users see all requests within their brand (developer sees global)
        let query = { ...brandFilter };

        const requests = await Support.find(query)
            .populate('createdBy', 'fullName')
            .populate('responses.sender', 'fullName')
            .populate('brand', 'name') // Populate brand name for developer view
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching support requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update status (Admin/Manager only)
export const updateSupportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isDeveloper(req.user)) {
            return res.status(403).json({ message: "Forbidden: Only the developer can update status." });
        }

        const request = await Support.findOneAndUpdate(
            { _id: id, ...req.brandFilter },
            { status },
            { new: true }
        ).populate('createdBy', 'fullName');

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        res.status(200).json({
            message: "Status updated successfully.",
            support: request
        });
    } catch (error) {
        console.error("Error updating support status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Add response
export const addSupportResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const request = await Support.findOne({ _id: id, ...req.brandFilter });
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        request.responses.push({
            message,
            sender: req.user.id
        });

        await request.save();
        await request.populate('responses.sender', 'fullName');

        res.status(200).json({
            message: "Response added successfully.",
            support: request
        });
    } catch (error) {
        console.error("Error adding support response:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
