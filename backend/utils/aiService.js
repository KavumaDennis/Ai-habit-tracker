import { GoogleGenerativeAI } from "@google/generative-ai"

let client = null

const getClient = () => {
    if (client) return client

    const key = process.env.GEMINI_API_KEY
    if (!key) return null

    client = new GoogleGenerativeAI(key)
    return client
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY

// -------------------------
// CLEAN JSON PARSER
// -------------------------
export const parseJSON = (text) => {
    try {
        let cleaned = (text || "").trim()

        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "")
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/```\n?/g, "")
        }

        return JSON.parse(cleaned.trim())
    } catch (err) {
        console.error("JSON parse error:", err.message)
        return null
    }
}

// -------------------------
// MAIN AI FUNCTION
// -------------------------
export const chatCompletion = async ({
    system,
    user,
    temperature = 0.7,
}) => {
    const c = getClient()

    if (!c) {
        return {
            ok: false,
            content:
                "AI features are disabled - set GEMINI_API_KEY in backend .env",
        }
    }

    try {
        const model = c.getGenerativeModel({
            model: MODEL,
            systemInstruction: system,
        })

        const result = await model.generateContent(user)
        const response = await result.response

        const text = response.text()

        return {
            ok: true,
            content: (text || "").trim(),
        }
    } catch (err) {
        console.error("FULL AI ERROR:", err)

        return {
            ok: false,
            content: "AI request failed. Please try again later.",
        }
    }
}

// -------------------------
// SYSTEM PROMPTS
// -------------------------
export const SYSTEM_PROMPTS = {
    weekly:
        "You are a warm, encouraging habit coach. Analyse the user's last 7 days of habit data and write a short personalised report (120-180 words). Mention what went well, what struggled, patterns noticed, and one specific encouragement. Use actual habit names. No markdown.",

    suggestion:
        "You are a habit coach. Suggest exactly 3 personalised habits based on user input. Return ONLY valid JSON: {\"suggestions\":[{\"name\":\"...\",\"description\":\"...\",\"frequency\":\"daily|weekly\",\"category\":\"Health|Fitness|Learning|Mindfulness|Productivity|Social|Finance|Creative|Other\",\"icon\":\"emoji\",\"reason\":\"...\"}]}",

    recovery:
        "You are a supportive habit recovery coach. Write a 3-day recovery plan for a broken streak. Structure: short empathy, Day 1, Day 2, Day 3 actions, and closing encouragement. 150–220 words.",

    chat:
        "You are a habit analysis assistant. Answer using ONLY provided data. Be specific with names and percentages. Max 120 words.",

    morning:
        "You are a warm friend. Write a 30–60 word morning message using user habits and streaks. Mention 1–2 habits. Energetic but simple."
}