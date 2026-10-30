import express from 'express';
import NodeCache from 'node-cache';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Dedicated rate-limiting cache instance: 60s TTL, auto cleanup every 120s
export const aiRateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

/**
 * @route   POST /api/ai/generate-description
 * @desc    Generate a complete, professional task description using Google Gemini REST API (gemini-3.8-flash)
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

    // Call Google Gemini REST API using Node.js native fetch with x-goog-api-key header
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
                'You are a professional assistant that generates clear, complete, and actionable task descriptions. Given a task title, write 2 to 4 complete sentences outlining concrete action items, objectives, and deliverables. Ensure every sentence is fully finished and ends with proper punctuation (. ! ?). Never produce trailing phrases, headings, bullet points, introductory text, quotation marks, or incomplete thoughts.'
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Write a complete 2 to 4 sentence actionable task description for: "${trimmedTitle}".`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 350,
          temperature: 0.7
        }
      })
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

    let cleanedDescription = generatedRaw;

    // Guard against mid-sentence truncation: keep only complete sentences if cut off
    if (cleanedDescription && !/[.!?]$/.test(cleanedDescription)) {
      const lastPunctuationIndex = Math.max(
        cleanedDescription.lastIndexOf('.'),
        cleanedDescription.lastIndexOf('!'),
        cleanedDescription.lastIndexOf('?')
      );
      if (lastPunctuationIndex > 20) {
        cleanedDescription = cleanedDescription
          .slice(0, lastPunctuationIndex + 1)
          .trim();
      } else {
        cleanedDescription = '';
      }
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
    console.error('[AI Route Error]', err.name || 'Error');
    return res.status(500).json({
      error: 'An internal error occurred while generating the task description.'
    });
  }
});

export default router;
