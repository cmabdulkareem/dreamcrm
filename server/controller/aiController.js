import Customer from "../model/customerModel.js";
import { analyzeLead, scoreLead } from "../utils/aiService.js";

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

/**
 * Scores a specific lead (0-100) and returns the score and reasoning.
 * Updates the lead record in the database.
 */
export const getLeadScore = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await Customer.findById(id);
        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        const scoringResult = await scoreLead(lead);

        // Update lead with new AI score and reasoning
        const updatedLead = await Customer.findByIdAndUpdate(
            id,
            {
                aiScore: scoringResult.score,
                aiScoreReasoning: scoringResult.reasoning
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            score: updatedLead.aiScore,
            reasoning: updatedLead.aiScoreReasoning
        });
    } catch (error) {
        console.error("Error in getLeadScore:", error);
        if (error.message?.startsWith('RATE_LIMITED:')) {
            const waitSecs = error.message.split(':')[1];
            return res.status(429).json({
                message: `AI quota exceeded. Please retry in ${waitSecs} seconds.`,
                retryAfter: parseInt(waitSecs)
            });
        }
        res.status(500).json({ message: "Server error during AI scoring" });
    }
};
