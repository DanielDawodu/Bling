import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

console.log("--- GEMINI SERVICE FILE LOADED ---");

let genAI;

const getGenAI = () => {
    if (!genAI) {
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is missing from environment.');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

// Models to try in order of preference
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 2000;

/**
 * Helper: sleep for a given number of ms
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: attempt a Gemini call with retry + model fallback
 * Handles 429 (rate limit) errors by retrying with backoff,
 * then falling back to alternate models.
 */
const callWithRetry = async (callFn) => {
    for (const model of MODELS) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await callFn(model);
            } catch (error) {
                const status = error?.status || error?.httpStatusCode || error?.code;
                const is429 = status === 429 ||
                    error.message?.includes('429') ||
                    error.message?.includes('quota') ||
                    error.message?.includes('RESOURCE_EXHAUSTED');

                console.warn(
                    `Gemini attempt ${attempt + 1}/${MAX_RETRIES + 1} with model "${model}" failed:`,
                    error.message?.substring(0, 200)
                );

                if (is429 && attempt < MAX_RETRIES) {
                    // Parse retry delay from error if available, otherwise use exponential backoff
                    const retryMatch = error.message?.match(/retry\s*(?:in|after)\s*([\d.]+)s/i);
                    const delayMs = retryMatch
                        ? Math.ceil(parseFloat(retryMatch[1]) * 1000)
                        : BASE_DELAY_MS * Math.pow(2, attempt);
                    console.log(`Rate limited. Retrying in ${delayMs}ms...`);
                    await sleep(delayMs);
                    continue;
                }

                if (is429) {
                    // Exhausted retries for this model, try next model
                    console.log(`Quota exhausted for "${model}", trying next model...`);
                    break;
                }

                // Non-rate-limit error — don't retry, propagate immediately
                throw error;
            }
        }
    }

    // All models and retries exhausted
    throw new Error(
        'Bling AI is temporarily unavailable due to API rate limits. Please try again in a few minutes.'
    );
};

/**
 * Audit a user for verification based on their profile data
 */
export const auditUserVerification = async (userData) => {
    try {
        const prompt = `
You are "Bling AI", the official Developer Advocate for the Bling social platform.
Your task is to audit a user's profile to see if they qualify for a "Verified Developer" badge.

User Profile Data:
- Username: ${userData.username}
- Bio: ${userData.bio || 'Not set'}
- Website: ${userData.socialLinks?.website || 'Not set'}
- GitHub: ${userData.socialLinks?.github || 'Not set'}
- LinkedIn: ${userData.socialLinks?.linkedin || 'Not set'}
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
Respond ONLY with the JSON object, no markdown, no explanation.
        `;

        const text = await callWithRetry(async (modelName) => {
            const client = getGenAI();
            const model = client.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        });

        // Strip markdown code fences if present
        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        return JSON.parse(clean);
    } catch (error) {
        console.error('!!! GEMINI AUDIT ERROR !!!', error.message);
        throw new Error(error.message || 'Bling AI is currently busy');
    }
};

/**
 * Audit content (posts, jobs, snippets) for authenticity and quality
 */
export const auditContent = async ({ type, data }) => {
    try {
        let context = '';
        if (type === 'job') {
            context = `Job Title: ${data.title}\nDescription: ${data.description}\nCompany: ${data.company}\nLocation: ${data.location}`;
        } else if (type === 'snippet') {
            context = `Snippet Title: ${data.title}\nDescription: ${data.description}\nCode Language: ${data.language}\nCode:\n${data.code}`;
        } else if (type === 'post') {
            context = `Post Content: ${data.content}\nTags: ${data.tags}`;
        }

        const prompt = `
You are "Bling AI", the platform's Content Moderator and Quality Assurance bot.
Verify the authenticity and quality of the following ${type}.

Content Data:
${context}

Criteria:
1. Authenticity: Does it look like a real, legitimate ${type}?
2. Safety: Is it free of spam, hate speech, or malicious intent?
3. Quality: Is it well-structured and relevant to developers?

JSON Output Format:
{
    "isAuthentic": boolean,
    "safetyScore": 0-100,
    "qualityScore": 0-100,
    "flags": ["list", "of", "issues", "if", "any"],
    "verdict": "approved" | "flagged" | "rejected"
}

Respond ONLY with the JSON object, no markdown, no explanation.
        `;

        const text = await callWithRetry(async (modelName) => {
            const client = getGenAI();
            const model = client.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        });

        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        return JSON.parse(clean);
    } catch (error) {
        console.error('Gemini Content Audit Error:', error.message);
        throw new Error(error.message || 'Bling AI is currently busy');
    }
};

/**
 * General chat with Bling AI using multi-turn conversation
 */
export const chatWithBlingAI = async (message, history = []) => {
    try {
        console.log('chatWithBlingAI (Gemini) called with message:', message);

        const systemInstruction = `You are "Bling AI", a helpful, witty, and tech-savvy assistant built into the Bling social network — the developer's second brain.
Keep responses concise and use a developer-friendly tone. You know Markdown but keep it minimal.

Core facts:
- Daniel Dawodu is the founder of Bling.
- Marvellous Obama is Daniel's friend and colleague.
- Bling is a developer-first social network for coders, engineers, and builders.
- You can verify profiles, jobs, snippets, and posts when asked.
- You love TypeScript, clean architecture, and well-documented APIs.

Be witty, sharp, and act like the most helpful senior dev on the team.`;

        // Convert history to Gemini format
        let geminiHistory = [];
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                let role = 'user';
                if (msg.role === 'model' || msg.role === 'assistant') {
                    role = 'model';
                }
                let text = '';
                if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                    text = msg.parts[0].text;
                } else if (typeof msg.content === 'string') {
                    text = msg.content;
                } else if (typeof msg.text === 'string') {
                    text = msg.text;
                }
                if (text) {
                    geminiHistory.push({ role, parts: [{ text }] });
                }
            });
        }
        
        // Gemini requires the first message in history to be from the 'user'
        while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
            geminiHistory.shift();
        }


        const responseText = await callWithRetry(async (modelName) => {
            const client = getGenAI();
            const model = client.getGenerativeModel({
                model: modelName,
                systemInstruction,
            });
            const chat = model.startChat({ history: geminiHistory });
            const result = await chat.sendMessage(message);
            return result.response.text();
        });

        return responseText;
    } catch (error) {
        console.error('!!! GEMINI CHAT ERROR !!!', error.message);
        throw new Error(error.message || 'Bling AI is currently busy');
    }
};
