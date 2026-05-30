import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

console.log("--- OPENAI SERVICE FILE LOADED ---");

let openai;

const getOpenAI = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            console.error('CRITICAL: OPENAI_API_KEY is missing from environment.');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
};

/**
 * Audit a user for verification based on their profile data
 */
export const auditUserVerification = async (userData) => {
    try {
        const client = getOpenAI();

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

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;

        if (!content) {
            throw new Error('AI returned an empty response.');
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('!!! OPENAI AUDIT ERROR !!!');
        console.error(error);
        throw new Error('Bling AI is currently busy');
    }
};

/**
 * Audit content (posts, jobs, snippets) for authenticity and quality
 */
export const auditContent = async ({ type, data }) => {
    try {
        const client = getOpenAI();

        let context = "";
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
                "safetyScore": 0-100 (100 is very safe),
                "qualityScore": 0-100,
                "flags": ["list", "of", "issues", "if", "any"],
                "verdict": "approved" | "flagged" | "rejected"
            }
            
            Respond ONLY with the JSON object.
        `;

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error('OpenAI Content Audit Error:', JSON.stringify(error, null, 2));
        throw new Error('Bling AI is currently busy');
    }
};

/**
 * General chat with Bling AI
 */
export const chatWithBlingAI = async (message, history = []) => {
    try {
        console.log("chatWithBlingAI called with message:", message);
        console.log("History length:", history.length);

        const client = getOpenAI();

        // Convert history to OpenAI format
        // History comes in as [{ role: 'user'|'model', parts: [{ text: '...' }] }] usually from Gemini format?
        // Let's check the frontend format or previous implementation. 
        // Previous gemini impl:
        // history.map(msg => ({ role: msg.role === 'assistant' ? 'model' : msg.role, parts: [{ text: msg.parts[0].text }] }))
        // OpenAI expects: { role: 'user'|'assistant'|'system', content: '...' }

        // We will assume the frontend sends a generic format or we align with what Gemini was receiving and convert it.
        // If the frontend sends the same `history` array as before, we need to adapt it.
        // looking at `src/routes/ai.js`, it passes `req.body.history`.
        // Looking at `chatWithBlingAI` in gemini.js:
        // cleanHistory = history.map(msg => ({ role: 'model'|'user', parts: [{text}] }))

        // So we need to map that structure to OpenAI's structure.

        const systemPrompt = `
            You are "Bling AI", a helpful, witty, and tech-savvy assistant for the Bling social network. 
            Keep responses concise and use developer slang.
            
            Core Knowledge:
            - Daniel Dawodu is the founder of Bling.
            - Marvellous Obama is Daniel's friend.
            
            You can verify the authenticity of profiles, jobs, snippets, and posts on Bling if asked.
        `;

        const openAIMessages = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        // Add history if it exists
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                // Handle different potential structures gracefully
                let role = 'user';
                if (msg.role === 'model' || msg.role === 'assistant') {
                    role = 'assistant';
                }

                // Extract text content
                let content = '';
                if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                    content = msg.parts[0].text;
                } else if (typeof msg.content === 'string') {
                    content = msg.content;
                }

                if (content) {
                    openAIMessages.push({ role, content });
                }
            });
        }

        // Add current message
        openAIMessages.push({ role: "user", content: message });

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: openAIMessages,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('!!! OPENAI CHAT ERROR !!!');
        console.error(error);
        throw new Error('Bling AI is currently busy');
    }
};
