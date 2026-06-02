/**
 * adaptiveContentService.js
 * ─────────────────────────────────────────────────────────────────────
 * Orchestrates personalized exercise delivery:
 *  1. Tries DeepSeek AI for unique, tailored content
 *  2. Falls back to static contentLibrary if AI is unavailable
 *  3. Tracks seen exercise IDs in localStorage to avoid repetition
 *  4. Updates user profile after each exercise session
 */

import { getStaticExercise, mapToDifficulty } from './contentLibrary';
import { updateUserProfileFromSession } from './assessmentService';
import { generatePersonalizedExercise }  from './deepseekService';


// ── Seen-exercise history (prevents repetition) ───────────────
const SEEN_KEY = 'lexilearn:seenExercises';

function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); }
  catch { return []; }
}

function addSeenId(id) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id].slice(-200)));
    }
  } catch { /* ignore */ }
}

export function clearExerciseHistory() {
  try { localStorage.removeItem(SEEN_KEY); } catch { /* ignore */ }
}

// ── Main: Get Next Exercise ───────────────────────────────────

/**
 * Returns the next personalized exercise for a user.
 * Tries DeepSeek AI first, falls back to static pool.
 *
 * @param {object} userProfile  - { skillLevel, weakAreas, learningRate, dyslexiaPatterns, userId }
 * @param {'reading'|'phonics'|'vocabulary'} exerciseType
 * @returns {Promise<object|null>}
 */
export async function getNextExercise(userProfile, exerciseType = 'reading') {
  const skillLevel   = userProfile?.skillLevel   || 'beginner';
  const learningRate = userProfile?.learningRate  || 'average';
  const difficulty   = mapToDifficulty(skillLevel, learningRate);
  const seenIds      = getSeenIds();

  // 1. Try AI (only for logged-in users to conserve API calls)
  if (userProfile?.userId) {
    const aiExercise = await generatePersonalizedExercise(userProfile, exerciseType, difficulty);
    if (aiExercise) {
      addSeenId(aiExercise.id);
      return aiExercise;
    }
  }

  // 2. Fall back to static pool
  const staticExercise = getStaticExercise(exerciseType, difficulty, seenIds);
  if (staticExercise) {
    addSeenId(staticExercise.id);
    return { ...staticExercise, source: 'static' };
  }

  return null;
}

// ── Post-Exercise Profile Update ─────────────────────────────

/**
 * Called after user completes an exercise.
 * Updates profile in Supabase and fires a profile-refresh event.
 *
 * @param {string} userId
 * @param {object} result  - { correct, timeTakenMs, xpEarned, confusedLetters, accuracy }
 */
export async function updateAfterExercise(userId, result) {
  if (!userId) return;

  await updateUserProfileFromSession(userId, {
    xpEarned:       result.xpEarned      ?? (result.correct ? 10 : 2),
    accuracy:       result.accuracy      ?? (result.correct ? 100 : 0),
    confusedLetters: result.confusedLetters ?? [],
  });

  // Notify AssessmentContext to refresh
  window.dispatchEvent(new Event('lexilearn:profile'));
}

// ── Difficulty Escalation ─────────────────────────────────────

/**
 * Given recent performance, suggest difficulty adjustment.
 *
 * @param {boolean[]} recentResults  - last 5 exercise outcomes (true = correct)
 * @param {string} currentDifficulty
 * @returns {'easy'|'medium'|'hard'}
 */
export function suggestDifficultyAdjustment(recentResults, currentDifficulty) {
  if (recentResults.length < 3) return currentDifficulty;

  const accuracy = recentResults.filter(Boolean).length / recentResults.length;

  if (accuracy >= 0.8 && currentDifficulty !== 'hard') {
    // Doing well → go up
    return currentDifficulty === 'easy' ? 'medium' : 'hard';
  }
  if (accuracy <= 0.4 && currentDifficulty !== 'easy') {
    // Struggling → go down
    return currentDifficulty === 'hard' ? 'medium' : 'easy';
  }

  return currentDifficulty;
}

// ── Session Performance Tracker ───────────────────────────────
const PERF_KEY = 'lexilearn:sessionPerf';

export function recordExerciseResult(correct) {
  try {
    const existing = JSON.parse(localStorage.getItem(PERF_KEY) || '[]');
    const updated  = [...existing, correct].slice(-10); // last 10 results
    localStorage.setItem(PERF_KEY, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}

export function getRecentPerformance() {
  try {
    return JSON.parse(localStorage.getItem(PERF_KEY) || '[]');
  } catch { return []; }
}

export function clearSessionPerformance() {
  try { localStorage.removeItem(PERF_KEY); } catch { /* ignore */ }
}
