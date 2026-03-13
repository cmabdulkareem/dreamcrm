import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Analyzes lead data and suggests strategies to convince the lead.
 * @param {Object} leadData - The lead information (name, course, remarks, etc.)
 * @returns {Promise<string>} - AI suggested strategy
 */
export const analyzeLead = async (leadData) => {
    if (!process.env.GROQ_API_KEY) {
        return "AI analysis is not available. Please configure the GROQ_API_KEY.";
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: `
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

Be specific, actionable, and constructive. Focus on improving conversion chances.`
                }
            ],
            temperature: 0.5,
            max_tokens: 300,
        });

        return chatCompletion.choices[0]?.message?.content || "No suggestion generated.";
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "Failed to generate AI suggestion. Please try again later.";
    }
};

/**
 * Calculates a numerical score (0-100) for a lead using Groq AI.
 * @param {Object} leadData - The lead information
 * @returns {Promise<Object>} - { score: Number, reasoning: String }
 */
export const scoreLead = async (leadData) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a CRM lead scoring assistant. You always respond with valid JSON only — no markdown, no explanation outside the JSON."
                },
                {
                    role: "user",
                    content: `
Analyze the following lead data and provide a numerical 'Propensity to Convert' score from 0 to 100. Pay close attention to BOTH the text remarks AND the call tracking records (duration, incoming/outgoing).

Lead Data:
- Name: ${leadData.fullName}
- Course Preference: ${leadData.coursePreference?.join(", ") || "N/A"}
- Current Status: ${leadData.leadStatus}
- Potential: ${leadData.leadPotential}
- Latest Remarks: ${leadData.remarks?.map(r => r.remark).filter(Boolean).slice(-5).join(" | ") || "No remarks yet"}
- Call History: ${leadData.callLogs?.map(c => `[${c.callType?.toUpperCase() || 'UNKNOWN'}] Duration: ${c.duration}s, Note: ${c.remark || 'None'}`).slice(-5).join(" | ") || "No calls recorded"}

Scoring Guide:
- 80-100: Very high intent. Long phone conversations (>120s), incoming calls from the lead, clear follow-up commitment.
- 50-79: Moderate interest. Short but meaningful calls (30s-120s), some positive signals.
- 20-49: Low engagement. Unanswered calls (duration 0s), generic remarks, or 'call back later' without progress.
- 0-19: Explicitly not interested, invalid contact, completely non-responsive over 5+ attempts.

CRITICAL RULES:
1. NEVER give a high score (>50) based on gibberish. If the remarks consist of random keyboard mashing (e.g. "asdf", "test"), you MUST score under 20 UNLESS there are actual successful phone calls with long durations.
2. Unanswered calls (duration 0s) or very short calls (<10s) are negative signals. Multiple unanswered calls should tank the score, regardless of what the manual remark says.
3. RECENCY IS KEY: The most recent remark and call log matter the most. If the VERY LAST remark is highly positive (e.g., "ready to join", "wants to pay tomorrow"), the score should jump significantly (>75) even if past remarks were poor. If the very last interaction is negative or ghosted, the score must drop.
4. KEYWORD OVERRIDE: If any recent remark contains explicit buying signals like "coming for admission", "paid", "payment", or "enrolling", you MUST give a score of 85 or higher, regardless of call logs.
5. Return ONLY valid JSON with this exact structure:
{"score": number, "reasoning": "A concise 1-2 sentence explanation."}`
                }
            ],
            temperature: 0.3,
            max_tokens: 200,
        });

        const resultText = chatCompletion.choices[0]?.message?.content?.trim() || "{}";

        try {
            // Strip markdown code blocks if present
            const cleaned = resultText.replace(/```json|```/g, "").trim();
            return JSON.parse(cleaned);
        } catch (parseError) {
            console.error("Failed to parse Groq JSON output:", resultText);
            return { score: leadData.aiScore ?? null, reasoning: "AI scoring was attempted but the response format was unexpected." };
        }
    } catch (error) {
        // Handle rate limit gracefully
        if (error.status === 429) {
            const retryMatch = error.message?.match(/retry after (\d+)/i) || error.message?.match(/(\d+)\s*second/i);
            const waitSecs = retryMatch ? retryMatch[1] : '60';
            throw new Error(`RATE_LIMITED:${waitSecs}`);
        }
        console.error("AI Scoring Error:", error);
        throw error;
    }
};
