// DeepSeek AI Service – analyses learner performance and recommends next steps
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

// ─────────────────────────────────────────────────────────────────
// PER-ATTEMPT SPEECH EVALUATION (called after every recording)
// ─────────────────────────────────────────────────────────────────

/**
 * Sends a single speech attempt to DeepSeek for qualitative evaluation.
 * Falls back to rule-based feedback if API key is missing or call fails.
 *
 * @param {string} expectedText  The phrase the user was supposed to say
 * @param {string} spokenText    What the STT engine captured
 * @param {{ accuracy:number, correctness:number, speed:number }} metrics  Rule-based scores (0-100)
 * @returns {Promise<{ feedbackMessage:string, easierAlternative:string|null, clarity:number }>}
 */
export async function evaluateSpeechWithDeepSeek(expectedText, spokenText, metrics = {}) {
  console.log('[DeepSeek] Sending speech evaluation request...', { expectedText, spokenText, metrics });

  const fallback = () => {
    console.log('[DeepSeek] Fallback triggered – using rule-based feedback');
    return ruleBasedFeedback(metrics);
  };

  if (!API_KEY || API_KEY === 'your_key' || API_KEY === '') return fallback();

  const avg = Math.round(
    ((metrics.accuracy ?? 0) * 0.5) +
    ((metrics.correctness ?? 0) * 0.3) +
    ((metrics.speed ?? 0) * 0.2)
  );

  const prompt = `
You are a cheerful, encouraging speech coach AI for children with dyslexia.

Expected phrase: "${expectedText}"
What the child said: "${spokenText}"
Rule-based scores: accuracy=${metrics.accuracy ?? 0}%, correctness=${metrics.correctness ?? 0}%, speed=${metrics.speed ?? 0}%, overall=${avg}%

Respond ONLY with a valid JSON object (no markdown, no code block):
{
  "feedbackMessage": "<one cheerful sentence 5-10 words, suitable for a child, with an emoji>",
  "easierAlternative": <string with a shorter/simpler version of the phrase, or null if score >= 60>,
  "clarity": <integer 0-100 — your estimate of speech clarity based on how close the spoken text matches the expected>
}
`.trim();

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens:  200,
      }),
    });

    if (!res.ok) {
      console.warn('[DeepSeek] API responded with status', res.status);
      return fallback();
    }

    const json = await res.json();
    const raw  = json.choices?.[0]?.message?.content ?? '';

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    console.log('[DeepSeek] Response received ✓', parsed);

    return {
      feedbackMessage:   parsed.feedbackMessage   || '🎉 Great effort, keep going!',
      easierAlternative: parsed.easierAlternative || null,
      clarity:           Number(parsed.clarity)   || avg,
    };
  } catch (err) {
    console.warn('[DeepSeek] Evaluation error:', err.message);
    return fallback();
  }
}

// ─────────────────────────────────────────────────────────────────
// RULE-BASED FEEDBACK (fallback when API unavailable)
// ─────────────────────────────────────────────────────────────────

function ruleBasedFeedback(metrics = {}) {
  const avg = Math.round(
    ((metrics.accuracy ?? 0) * 0.5) +
    ((metrics.correctness ?? 0) * 0.3) +
    ((metrics.speed ?? 0) * 0.2)
  );

  if (avg >= 85) {
    return {
      feedbackMessage:   '🌟 Outstanding! You nailed it completely!',
      easierAlternative: null,
      clarity:           avg,
    };
  }
  if (avg >= 70) {
    return {
      feedbackMessage:   '🎉 Great job! Your answer was accurate!',
      easierAlternative: null,
      clarity:           avg,
    };
  }
  if (avg >= 50) {
    return {
      feedbackMessage:   '👍 Nice attempt! You\'re improving a lot!',
      easierAlternative: null,
      clarity:           avg,
    };
  }
  if (avg >= 30) {
    return {
      feedbackMessage:   '💪 Keep trying! You\'re getting better!',
      easierAlternative: 'Try saying just the first part of the phrase.',
      clarity:           avg,
    };
  }
  return {
    feedbackMessage:   '🔄 Let\'s try that one again together!',
    easierAlternative: 'Try saying just the first two words.',
    clarity:           avg,
  };
}

// ─────────────────────────────────────────────────────────────────
// PERFORMANCE ANALYSIS (used by adaptive learning for level changes)
// ─────────────────────────────────────────────────────────────────

/**
 * Sends recent attempt data to DeepSeek and returns adaptive recommendations.
 * Falls back to rule-based logic if the API key is missing or the request fails.
 *
 * @param {Array} attempts  Array of {accuracy, correctness, responseTime, score, type}
 * @param {string} type     'speech' | 'reading' | 'game'
 * @param {number} currentLevel  1–5
 * @returns {Promise<{recommendedLevel:number, shouldRepeat:boolean, easierAlternative:string|null, explanation:string}>}
 */
export async function analyzePerformance(attempts = [], type = 'speech', currentLevel = 1) {
  // Rule-based fallback (also used when api key absent)
  const fallback = () => ruleBasedDecision(attempts, currentLevel);

  if (!API_KEY || API_KEY === 'your_key') return fallback();

  const recentAvg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score ?? a.accuracy ?? 0), 0) / attempts.length)
    : 0;

  const prompt = `
You are an adaptive learning tutor AI for children with dyslexia.

The student is doing ${type} exercises at level ${currentLevel}/5.
Their last ${attempts.length} attempt(s) had an average performance score of ${recentAvg}/100.

Data: ${JSON.stringify(attempts.slice(-5))}

Respond ONLY with a valid JSON object (no markdown, no code block) with these keys:
{
  "recommendedLevel": <integer 1-5>,
  "shouldRepeat": <boolean>,
  "easierAlternative": <string or null — a shorter/easier version of the exercise>,
  "explanation": <string — one friendly sentence for the child or teacher>
}
`.trim();

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens:  256,
      }),
    });

    if (!res.ok) return fallback();

    const json = await res.json();
    const raw  = json.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      recommendedLevel:  Number(parsed.recommendedLevel)  || currentLevel,
      shouldRepeat:      Boolean(parsed.shouldRepeat),
      easierAlternative: parsed.easierAlternative || null,
      explanation:       parsed.explanation       || '',
    };
  } catch {
    return fallback();
  }
}

/** Rule-based fallback that mirrors basic adaptive logic */
function ruleBasedDecision(attempts, currentLevel) {
  const scores = attempts.map(a => a.score ?? a.accuracy ?? 0);
  const avg    = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;

  if (avg >= 85) {
    return {
      recommendedLevel:  Math.min(currentLevel + 1, 5),
      shouldRepeat:      false,
      easierAlternative: null,
      explanation:       'Great job! Moving up to the next level.',
    };
  }
  if (avg < 50) {
    return {
      recommendedLevel:  Math.max(currentLevel - 1, 1),
      shouldRepeat:      true,
      easierAlternative: 'Try a shorter version of this exercise.',
      explanation:       'Let\'s practise a bit more at this level before moving on.',
    };
  }
  return {
    recommendedLevel:  currentLevel,
    shouldRepeat:      false,
    easierAlternative: null,
    explanation:       'Keep going — you\'re making great progress!',
  };
}

// ─────────────────────────────────────────────────────────────────
// PERSONALIZED EXERCISE GENERATION
// ─────────────────────────────────────────────────────────────────

/**
 * Generates a unique, personalized exercise using DeepSeek.
 * Returns null on any failure so callers can fall back to static content.
 *
 * @param {object} userProfile  { skillLevel, weakAreas, learningRate, dyslexiaPatterns }
 * @param {'reading'|'phonics'|'vocabulary'} exerciseType
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {Promise<object|null>}
 */
export async function generatePersonalizedExercise(userProfile = {}, exerciseType = 'reading', difficulty = 'medium') {
  if (!API_KEY || API_KEY === 'your_key' || API_KEY === '') return null;

  const {
    skillLevel       = 'beginner',
    weakAreas        = [],
    learningRate     = 'average',
    dyslexiaPatterns = {},
  } = userProfile;

  const hasDyslexia  = Object.keys(dyslexiaPatterns).length > 0;
  const dyslexiaPairs = Object.keys(dyslexiaPatterns).join(', ');

  const systemMsg = [
    'You are a dyslexia-aware educational content generator for children aged 5–12.',
    'Generate exercises that are engaging, clear, encouraging, and age-appropriate.',
    hasDyslexia
      ? `IMPORTANT: This child confuses letters (${dyslexiaPairs}). Keep prompts unambiguous.`
      : '',
    'Respond with ONLY valid JSON — no markdown, no explanation.',
  ].filter(Boolean).join(' ');

  const seed = Math.random().toString(36).slice(2, 7);
  const userMsg = `Generate ONE unique ${difficulty} ${exerciseType} exercise.

User profile:
- Skill level: ${skillLevel}
- Learning speed: ${learningRate}
- Weak areas: ${weakAreas.length ? weakAreas.join(', ') : 'none'}
- Dyslexia patterns: ${hasDyslexia ? dyslexiaPairs : 'none'}

Requirements:
- Be creative — avoid common textbook examples.
- Child-friendly language and a positive tone.
- Exactly 4 answer options.
- The answer must exactly match one of the options.
${exerciseType === 'reading' ? '- Include a short passage (1–3 sentences) for comprehension.' : ''}

JSON format:
{
  "id": "ai-${seed}",
  "type": "${exerciseType}",
  "difficulty": "${difficulty}",
  "topic": "short label e.g. rhyme",
  "prompt": "The question text",
  "options": ["A","B","C","D"],
  "answer": "must match one option exactly",
  "hint": "optional hint or null",
  "passage": "optional passage or null"
}`;

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user',   content: userMsg },
        ],
        temperature: 0.9,
        max_tokens:  450,
      }),
    });

    if (!res.ok) { console.warn('[DeepSeek] generatePersonalizedExercise HTTP', res.status); return null; }

    const data    = await res.json();
    const raw     = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const ex      = JSON.parse(cleaned);

    if (!ex.prompt || !Array.isArray(ex.options) || ex.options.length !== 4 ||
        !ex.answer || !ex.options.includes(ex.answer)) {
      console.warn('[DeepSeek] Invalid exercise shape:', ex);
      return null;
    }

    console.log('[DeepSeek] ✅ Generated exercise:', ex.topic, '|', ex.difficulty);
    return { ...ex, source: 'ai' };

  } catch (e) {
    console.warn('[DeepSeek] generatePersonalizedExercise failed:', e.message);
    return null;
  }
}
