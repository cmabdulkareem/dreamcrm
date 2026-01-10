import Customer from "../model/customerModel.js";
import { analyzeLead } from "../utils/aiService.js";

/**
 * Analyzes a specific lead and returns AI suggestions.
 */
export const getLeadAnalysis = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await Customer.findById(id);
        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        const analysis = await analyzeLead(lead);

        res.status(200).json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error("Error in getLeadAnalysis:", error);
        res.status(500).json({ message: "Server error during AI analysis" });
    }
};
