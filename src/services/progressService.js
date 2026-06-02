// Progress Service – stores learning data in localStorage (guests) + Supabase (logged-in)
import { mergeConfusionHistory, getSortedConfusions } from './dyslexiaEngine';
import { supabase } from './supabaseClient';
import { updateUserProfileFromSession } from './assessmentService';

// Re-export so callers can import from one place
export { updateUserProfileFromSession };


const PROGRESS_KEY = 'lexilearn_progress';

const defaultProgress = () => ({
  totalPoints:        0,
  lessonsCompleted:   0,
  avgAccuracy:        0,
  dailyAccuracy:      [0,0,0,0,0,0,0],
  dailyTime:          [0,0,0,0,0,0,0],
  badges:             [],
  pronunciationScores:[],
  readingAccuracy:    [],
  streakDays:         0,
  lastActiveDate:     null,
  timeSpent:          0,           // minutes total
  mistakePatterns:    {},          // word -> miss count
  activityHistory:    [],          // [{type, score, level, ts}]
  readingLevel:       1,
  speechLevel:        1,
  gameLevel:          1,
  // ── Dyslexia tracking ───────────────────────────────────────
  confusionHistory:   {},          // 'b,d' -> count of confusions
  dyslexiaAccuracyHistory: [],     // last 20 dyslexia accuracy scores
  avgDyslexiaAccuracy: 0,
});

export function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  // Notify same-tab listeners (ProgressContext) immediately
  window.dispatchEvent(new Event('lexilearn:progress'));
}

// Compute streak
function updateStreak(data) {
  const today = new Date().toDateString();
  if (data.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  data.streakDays = data.lastActiveDate === yesterday ? (data.streakDays || 0) + 1 : 1;
  data.lastActiveDate = today;

  const dayIdx = new Date().getDay();
  data.dailyTime[dayIdx] = (data.dailyTime[dayIdx] || 0) + 1;
}

function checkBadges(data) {
  const badges = new Set(data.badges || []);
  if (data.lessonsCompleted >= 1)   badges.add('First Steps');
  if (data.totalPoints    >= 50)    badges.add('High Scorer');
  if (data.totalPoints    >= 200)   badges.add('Star Learner');
  if (data.streakDays     >= 3)     badges.add('3-Day Streak');
  if (data.streakDays     >= 7)     badges.add('Week Warrior');
  if ((data.avgAccuracy   || 0) >= 80 && data.lessonsCompleted >= 3) badges.add('Word Wizard');
  if (data.pronunciationScores.length >= 5) badges.add('Voice Champion');
  if (data.readingAccuracy.length     >= 5) badges.add('Reading Star');
  data.badges = [...badges];
}

// ────────────────────────────────────────────────────────────
// SUPABASE PERSISTENCE
// ────────────────────────────────────────────────────────────

/**
 * Inserts a single exercise attempt into Supabase.
 * Call this after any scored exercise when the user is logged in.
 *
 * @param {string} userId        Supabase auth user id
 * @param {{type, level, score, accuracy, correctness, responseTime, expectedText, spokenText}} attemptData
 */
export async function saveAttemptToSupabase(userId, attemptData) {
  if (!userId) return;
  console.log('[progressService] saveAttemptToSupabase:', {
    type: attemptData.type,
    score: attemptData.score,
    dyslexiaAccuracy: attemptData.dyslexiaAccuracy,
    confusedLetters: attemptData.confusedLetters,
  });
  try {
    const { error } = await supabase.from('exercise_attempts').insert([{
      user_id:          userId,
      type:             attemptData.type             ?? 'speech',
      level:            attemptData.level            ?? 1,
      score:            attemptData.score            ?? 0,
      accuracy:         attemptData.accuracy         ?? null,
      correctness:      attemptData.correctness      ?? null,
      response_time:    attemptData.responseTime     ?? null,
      expected_text:    attemptData.expectedText     ?? null,
      spoken_text:      attemptData.spokenText       ?? null,
      // Dyslexia fields (require SQL migration — see implementation_plan.md)
      confused_letters: attemptData.confusedLetters  ?? [],
      dyslexia_accuracy:attemptData.dyslexiaAccuracy ?? null,
    }]);
    if (error) console.error('[progressService] saveAttemptToSupabase error:', error.message);
  } catch (e) {
    console.error('[progressService] saveAttemptToSupabase exception:', e);
  }
}

/**
 * Upserts the progress_summary row for a logged-in user.
 * Reads current localStorage data and pushes it to Supabase.
 *
 * @param {string} userId  Supabase auth user id
 */
export async function syncProgressSummary(userId) {
  if (!userId) return;
  const data = getProgress();
  try {
    const { error } = await supabase.from('progress_summary').upsert({
      user_id:           userId,
      total_points:      data.totalPoints      || 0,
      lessons_completed: data.lessonsCompleted || 0,
      avg_accuracy:      data.avgAccuracy      || 0,
      streak_days:       data.streakDays       || 0,
      last_active_date:  data.lastActiveDate
        ? new Date(data.lastActiveDate).toISOString().split('T')[0]
        : null,
      reading_level:     data.readingLevel     || 1,
      speech_level:      data.speechLevel      || 1,
      game_level:        data.gameLevel        || 1,
      badges:            data.badges           || [],
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) console.error('[progressService] syncProgressSummary error:', error.message);
  } catch (e) {
    console.error('[progressService] syncProgressSummary exception:', e);
  }
}

/**
 * Fetches the progress summary from Supabase for a logged-in user.
 * Returns null if not found or on error.
 */
export async function fetchProgressFromSupabase(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('progress_summary')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches recent exercise attempts from Supabase for a logged-in user.
 */
export async function fetchAttemptsFromSupabase(userId, limit = 20) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('exercise_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// LOCAL SESSION LOGGERS
// ────────────────────────────────────────────────────────────

export function logGameCompletion(points, accuracy, level) {
  const data = getProgress();
  updateStreak(data);

  data.totalPoints      = (data.totalPoints || 0) + points;
  data.lessonsCompleted = (data.lessonsCompleted || 0) + 1;
  data.timeSpent        = (data.timeSpent || 0) + 2;

  const all = [...(data.readingAccuracy || []), accuracy];
  data.readingAccuracy  = all.slice(-20);
  data.avgAccuracy      = Math.round(all.reduce((a,b)=>a+b,0) / all.length);

  const dayIdx = new Date().getDay();
  data.dailyAccuracy[dayIdx] = Math.round(
    ((data.dailyAccuracy[dayIdx] || 0) + accuracy) / 2
  );

  data.activityHistory = [
    ...(data.activityHistory || []),
    { type: 'game', points, accuracy, level, ts: Date.now() }
  ].slice(-50);

  if (accuracy >= 80 && data.lessonsCompleted % 3 === 0) {
    data.gameLevel = Math.min((data.gameLevel || 1) + 1, 5);
  }

  checkBadges(data);
  saveProgress(data);
}

export function logSpeechSession(score, spoken, expected) {
  const data = getProgress();
  updateStreak(data);

  data.pronunciationScores = [...(data.pronunciationScores || []), score].slice(-20);
  data.totalPoints = (data.totalPoints || 0) + Math.round(score / 10);
  data.lessonsCompleted = (data.lessonsCompleted || 0) + 1;
  data.timeSpent = (data.timeSpent || 0) + 1;

  const expectedWords = expected.toLowerCase().split(/\s+/);
  const spokenWords   = spoken.toLowerCase().split(/\s+/);
  expectedWords.forEach(w => {
    if (!spokenWords.includes(w)) {
      data.mistakePatterns[w] = (data.mistakePatterns[w] || 0) + 1;
    }
  });

  if (score >= 80) {
    data.speechLevel = Math.min((data.speechLevel || 1) + 1, 5);
  }

  data.activityHistory = [
    ...(data.activityHistory || []),
    { type: 'speech', score, ts: Date.now() }
  ].slice(-50);

  checkBadges(data);
  saveProgress(data);
}

export function logReadingSession(accuracy, level) {
  const data = getProgress();
  updateStreak(data);

  data.readingAccuracy = [...(data.readingAccuracy || []), accuracy].slice(-20);
  data.totalPoints  = (data.totalPoints || 0) + Math.round(accuracy / 10) + 5;
  data.lessonsCompleted = (data.lessonsCompleted || 0) + 1;
  data.timeSpent    = (data.timeSpent || 0) + 2;

  const all = data.readingAccuracy;
  data.avgAccuracy = Math.round(all.reduce((a,b)=>a+b,0) / all.length);

  const dayIdx = new Date().getDay();
  data.dailyAccuracy[dayIdx] = Math.round(
    ((data.dailyAccuracy[dayIdx] || 0) + accuracy) / 2
  );

  if (accuracy >= 75 && data.lessonsCompleted % 3 === 0) {
    data.readingLevel = Math.min((data.readingLevel || 1) + 1, 5);
  }

  data.activityHistory = [
    ...(data.activityHistory || []),
    { type: 'reading', accuracy, level, ts: Date.now() }
  ].slice(-50);

  checkBadges(data);
  saveProgress(data);
}

export function resetProgress() {
  saveProgress(defaultProgress());
}

// ────────────────────────────────────────────────────────────
// DYSLEXIA CONFUSION TRACKING
// ────────────────────────────────────────────────────────────

/**
 * Logs a batch of confused letters from a session into localStorage.
 * @param {Array<{expected:string, got:string}>} confusedLetters
 * @param {number} dyslexiaAccuracy  0–100 letter-level accuracy
 */
export function logConfusionPattern(confusedLetters = [], dyslexiaAccuracy = 100) {
  if (!confusedLetters.length && dyslexiaAccuracy === 100) return;
  const data = getProgress();

  // Merge into history
  data.confusionHistory = mergeConfusionHistory(
    data.confusionHistory || {},
    confusedLetters
  );

  // Track accuracy history
  const accHistory = [...(data.dyslexiaAccuracyHistory || []), dyslexiaAccuracy].slice(-20);
  data.dyslexiaAccuracyHistory = accHistory;
  data.avgDyslexiaAccuracy = Math.round(
    accHistory.reduce((s, v) => s + v, 0) / accHistory.length
  );

  console.log('[progressService] logConfusionPattern — history after update:', data.confusionHistory);
  saveProgress(data);
}

/**
 * Returns sorted confusion pairs from localStorage.
 * @returns {Array<{pair:string, a:string, b:string, count:number}>}
 */
export function getConfusionHistory() {
  const { confusionHistory = {} } = getProgress();
  return getSortedConfusions(confusionHistory);
}
