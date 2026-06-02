// Adaptive Learning – analyses progress data and recommends personalised content
import { getProgress } from './progressService';
import { analyzePerformance } from './deepseekService';

// ────────────────────────────────────────────────────────────
// STRING UTILITIES
// ────────────────────────────────────────────────────────────

/** Levenshtein edit distance between two strings */
export function levenshteinDistance(a = '', b = '') {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Word-level similarity (0–100).
 * Percentage of expected words that appear in the spoken words.
 */
export function wordSimilarity(expected = '', spoken = '') {
  const expWords = expected.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const spkWords = spoken.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  if (!expWords.length) return 100;
  const matched = expWords.filter(w => spkWords.includes(w)).length;
  return Math.round((matched / expWords.length) * 100);
}

// ────────────────────────────────────────────────────────────
// SPEECH EVALUATION
// ────────────────────────────────────────────────────────────

/**
 * Evaluates a speech attempt using three metrics.
 *
 * @param {string} expected    The ideal phrase
 * @param {string} spoken      What the user actually said (STT output)
 * @param {number} startTime   Performance.now() when audio playback ended
 * @param {number} endTime     Performance.now() when recording finished
 * @returns {{ accuracy, correctness, responseTime, performanceScore, metrics }}
 */
export function evaluateSpeech(expected = '', spoken = '', startTime = 0, endTime = 0) {
  // Normalise
  const normExp = expected.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const normSpk = spoken.toLowerCase().replace(/[^a-z\s]/g, '').trim();

  // 1. Accuracy – character-level edit distance
  const maxLen   = Math.max(normExp.length, normSpk.length, 1);
  const editDist = levenshteinDistance(normExp, normSpk);
  const accuracy = Math.max(0, Math.round((1 - editDist / maxLen) * 100));

  // 2. Correctness – word-level overlap
  const correctness = wordSimilarity(expected, spoken);

  // 3. Response-time score (ideal ≤ 8 s → 100, > 20 s → 0)
  const responseTime  = endTime > startTime ? (endTime - startTime) / 1000 : 0;
  const maxGoodTime   = 8;
  const maxAllowedTime = 20;
  const responseSpdScore = responseTime <= maxGoodTime
    ? 100
    : Math.max(0, Math.round(100 - ((responseTime - maxGoodTime) / (maxAllowedTime - maxGoodTime)) * 100));

  // Weighted composite (plan spec)
  const performanceScore = Math.round(
    accuracy * 0.5 + correctness * 0.3 + responseSpdScore * 0.2
  );

  return {
    accuracy,
    correctness,
    responseTime: Math.round(responseTime * 10) / 10,
    performanceScore,
    metrics: { accuracy, correctness, speed: responseSpdScore },
  };
}

// ────────────────────────────────────────────────────────────
// ADAPTIVE PROMPT SELECTION
// ────────────────────────────────────────────────────────────

/**
 * Calls DeepSeek (or falls back to rules) to decide what to show next.
 *
 * @param {string} userId          User ID (or null for guests)
 * @param {number} currentLevel    1–5
 * @param {Array}  recentAttempts  Last few {score, accuracy, correctness, responseTime}
 * @returns {Promise<{recommendedLevel, shouldRepeat, easierAlternative, explanation}>}
 */
export async function getAdaptivePrompt(userId, currentLevel = 1, recentAttempts = []) {
  return analyzePerformance(recentAttempts, 'speech', currentLevel);
}

// ────────────────────────────────────────────────────────────
// LEGACY HELPERS (preserved for Dashboard / ProgressTracker)
// ────────────────────────────────────────────────────────────

/** Returns the recommended difficulty level (1-5) for a given activity type. */
export function getAdaptedDifficulty(type = 'reading') {
  const data = getProgress();
  if (type === 'speech')  return Math.min(data.speechLevel  || 1, 5);
  if (type === 'game')    return Math.min(data.gameLevel    || 1, 5);
  return Math.min(data.readingLevel || 1, 5);
}

/** Returns the top-N words the child struggles with. */
export function getMistakeWords(limit = 3) {
  const { mistakePatterns = {} } = getProgress();
  return Object.entries(mistakePatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/** Returns a human-readable recommendation message. */
export function getRecommendedActivity() {
  const data    = getProgress();
  const history = data.activityHistory || [];

  if (history.length === 0) return { type: 'reading', message: 'Start with Reading Practice!', emoji: '📖' };

  const recentTypes = history.slice(-6).map(h => h.type);
  if (!recentTypes.includes('speech'))  return { type: 'speech',  message: 'Practice your pronunciation!', emoji: '🎤' };
  if (!recentTypes.includes('game'))    return { type: 'games',   message: 'Play a Learning Game!',        emoji: '🎮' };
  if (!recentTypes.includes('reading')) return { type: 'reading', message: 'Read a new story!',            emoji: '📖' };

  const avgSpeech  = average(history.filter(h => h.type === 'speech').slice(-3).map(h => h.score || 0));
  const avgReading = average(history.filter(h => h.type === 'reading').slice(-3).map(h => h.accuracy || 0));

  if (avgSpeech < avgReading) return { type: 'speech',  message: 'Keep practising pronunciation!', emoji: '🎤' };
  return                              { type: 'reading', message: 'Read more stories!',             emoji: '📖' };
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
