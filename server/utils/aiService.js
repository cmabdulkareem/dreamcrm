import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes lead data and suggests strategies to convince the lead.
 * @param {Object} leadData - The lead information (name, course, remarks, etc.)
 * @returns {Promise<string>} - AI suggested strategy
 */
export const analyzeLead = async (leadData) => {
    if (!process.env.GEMINI_API_KEY) {
        return "AI analysis is not available. Please configure the GEMINI_API_KEY.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
      You are an expert CRM consultant and sales strategist from Aizax web tech. 
      Analyze the following lead data and provide a concise (2-3 sentences) actionable advice.
      
      Lead Data:
      - Name: ${leadData.fullName}
      - Course Preference: ${leadData.coursePreference?.join(", ") || "N/A"}
      - Current Status: ${leadData.leadStatus}
      - Potential: ${leadData.leadPotential}
      - Latest Remarks: ${leadData.remarks?.map(r => r.remark).slice(-3).join(" | ") || "No remarks yet"}
      
      Your response MUST include:
      1. What should be done NEXT as the immediate action step
      2. What mistakes or issues you identify in the current approach based on the remarks (if any)
      
      Be specific, actionable, and constructive. Focus on improving conversion chances.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "Failed to generate AI suggestion. Please try again later.";
    }
};
