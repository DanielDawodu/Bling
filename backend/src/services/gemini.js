import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

let genAI;

const getGenAI = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is missing from environment.');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
};

/**
 * Audit a user for verification based on their profile data
 */
export const auditUserVerification = async (userData) => {
    try {
        const model = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            You are "Bling AI", the official Developer Advocate for the Bling social platform.
            Your task is to audit a user's profile to see if they qualify for a "Verified Developer" badge.

            User Profile Data:
            - Username: ${userData.username}
            - Bio: ${userData.bio}
            - Website: ${userData.socialLinks?.website}
            - GitHub: ${userData.socialLinks?.github}
            - LinkedIn: ${userData.socialLinks?.linkedin}
            - Account Created: ${userData.createdAt}
            - Posts Count: ${userData.postsCount}
            - Followers: ${userData.followersCount}

            Criteria for Verification:
            1. Professional and descriptive bio related to software development.
            2. Presence of a valid portfolio or GitHub link.
            3. Active participation (has posts).
            4. Clear identity (username isn't just random numbers).

            JSON Output Format:
            {
                "score": 0-100,
                "status": "approved" | "pending" | "rejected",
                "feedback": "Specific advice on what to improve",
                "reasoning": "Internal explanation for admins"
            }

            Be fair but encouraging. If someone is a clear professional, give them a high score.
            Respond ONLY with the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Find the JSON block
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Gemini returned no valid JSON:', text);
            throw new Error('AI returned an invalid response format.');
        }

        return JSON.parse(jsonMatch[0].trim());
    } catch (error) {
        console.error('Gemini Audit Error:', JSON.stringify(error, null, 2));
        console.error('Stack Trace:', error.stack);
        throw new Error(`AI Audit error: ${error.message || 'Unknown error'}`);
    }
};

/**
 * General chat with Bling AI
 */
export const chatWithBlingAI = async (message, history = []) => {
    try {
        // Ensure history strictly alternates between user and model roles.
        // The first message in history must be 'user'.
        // We filter out any initial 'model' messages from the frontend.
        const cleanHistory = (history || [])
            .filter(msg => msg.parts && msg.parts[0] && msg.parts[0].text)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role,
                parts: [{ text: msg.parts[0].text }]
            }));

        // If the first message is 'model', Gemini will error.
        if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
            cleanHistory.shift();
        }

        const chat = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" }).startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "You are 'Bling AI', a helpful, witty, and tech-savvy assistant for the Bling social network. Keep responses concise and use developer slang." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Yo! Bling AI in the house. Ready to help you ship some code and level up your profile. What's the word?" }],
                },
                ...cleanHistory
            ]
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Chat Error:', JSON.stringify(error, null, 2));
        console.error('Stack Trace:', error.stack);
        if (error.message && error.message.includes('API_KEY_INVALID')) {
            throw new Error('Invalid Gemini API Key. Please check your .env file.');
        }
        throw new Error(`Bling AI error: ${error.message || 'Unknown error'}`);
    }
};
