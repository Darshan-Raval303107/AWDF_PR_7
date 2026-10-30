import express from 'express';
import NodeCache from 'node-cache';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Dedicated rate-limiting cache instance: 60s TTL, auto cleanup every 120s
export const aiRateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

// Request timeout for Gemini API calls (5 seconds)
const GEMINI_REQUEST_TIMEOUT_MS = 5000;

/**
 * @route   POST /api/ai/generate-description
 * @desc    Generate exactly 3 concise, professional, and actionable bullet points using Google Gemini REST API
 * @access  Private (Protected by authMiddleware)
 */
router.post('/generate-description', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    // Validate required title input
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const trimmedTitle = title.trim();

    // Rate Limiting: 1 request per authenticated user and normalized task title per 60 seconds
    const userId =
      req.user?._id?.toString() || req.user?.id?.toString() || 'unknown_user';
    const normalizedTitle = trimmedTitle.toLowerCase();
    const rateLimitKey = `ai_cooldown:${userId}:${normalizedTitle}`;

    if (aiRateLimitCache.has(rateLimitKey)) {
      return res.status(429).json({
        error:
          'Please wait 1 minute before generating another description for this task.'
      });
    }

    // Securely retrieve API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in the server environment.'
      });
    }

    // Call Google Gemini REST API using Node.js native fetch with timeout signal
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You are an expert AI task assistant that writes concise, professional, and actionable task descriptions. Given a task title, generate exactly 3 plain-text bullet points. Each bullet point must start with "- " and describe a specific action, objective, or expected outcome directly relevant to the task title. For specific titles, provide task-specific action points. For broad or vague titles, provide broadly useful and relevant action points without assuming unmentioned starter code, specific endpoints, particular technologies, tools, or deadlines. Avoid repeating the task title and avoid generic filler. Use simple, professional English. Ensure every bullet point is a complete, finished sentence ending with a period. Return only the 3 bullet points with no introductory or concluding text.'
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Generate exactly 3 concise, meaningful bullet points for the task: "${trimmedTitle}".`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 180,
          temperature: 0.2,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      }),
      signal: AbortSignal.timeout(GEMINI_REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      console.error(
        '[Gemini API Error]',
        response.status,
        errorPayload?.error?.status || 'unknown_status'
      );
      return res.status(502).json({
        error:
          'AI service request failed. Please verify API key, billing, or try again later.'
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const generatedRaw = candidate?.content?.parts?.[0]?.text?.trim() || '';

    // Extract, format, and ensure exactly 3 plain-text bullet points
    const lines = generatedRaw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const bulletItems = lines
      .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter((item) => item.length > 5);

    const completeBullets = bulletItems.slice(0, 3).map((item) => {
      return /[.!?]$/.test(item) ? item : `${item}.`;
    });

    let cleanedDescription = '';
    if (completeBullets.length >= 3) {
      cleanedDescription = completeBullets.map((b) => `- ${b}`).join('\n');
    } else if (completeBullets.length > 0) {
      cleanedDescription = completeBullets.map((b) => `- ${b}`).join('\n');
    }

    if (!cleanedDescription) {
      return res.status(502).json({
        error:
          'AI service returned an incomplete description. Please try again.'
      });
    }

    // Set 60-second cooldown entry upon successful description generation
    aiRateLimitCache.set(rateLimitKey, true, 60);

    return res.json({
      description: cleanedDescription,
      generatedBy: 'ai'
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.error('[AI Route Timeout]', err.message);
      return res.status(504).json({
        error: 'AI service request timed out. Please try again.'
      });
    }

    console.error('[AI Route Error]', err.name || 'Error');
    return res.status(500).json({
      error: 'An internal error occurred while generating the task description.'
    });
  }
});

export default router;
