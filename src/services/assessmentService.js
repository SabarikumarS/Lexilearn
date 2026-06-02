/**
 * assessmentService.js
 * ─────────────────────────────────────────────────────────────────────
 * Pre-Assessment engine for LexiLearn.
 * Provides: question bank, scoring, skill classification,
 *           dyslexia detection, learning path generation, and Supabase I/O.
 */

import { supabase } from './supabaseClient';
import { mergeConfusionHistory } from './dyslexiaEngine';

// ─────────────────────────────────────────────────────────────────────
// QUESTION BANK
// Each question: { id, section, difficulty, type, prompt, options, answer, confusionPairs? }
// ─────────────────────────────────────────────────────────────────────

export const SECTIONS = ['alphabet', 'phonics', 'vocabulary', 'sentence', 'comprehension'];

export const SECTION_LABELS = {
  alphabet:      '🔤 Alphabet Recognition',
  phonics:       '🔊 Phonics',
  vocabulary:    '📝 Vocabulary',
  sentence:      '📖 Sentence Reading',
  comprehension: '🧠 Comprehension',
};

export const QUESTION_BANK = {
  alphabet: [
    // ── Easy ──────────────────────────────────────────────────────────────
    {
      id: 'a-e1', difficulty: 'easy',
      type: 'choose_letter',
      prompt: 'Which letter comes after "D" in the alphabet?',
      options: ['C', 'E', 'F', 'B'],
      answer: 'E',
    },
    {
      id: 'a-e2', difficulty: 'easy',
      type: 'choose_letter',
      prompt: 'Which letter is a vowel?',
      options: ['B', 'C', 'O', 'T'],
      answer: 'O',
    },
    {
      id: 'a-e3', difficulty: 'easy',
      type: 'choose_letter',
      prompt: 'What is the first letter of the alphabet?',
      options: ['B', 'A', 'Z', 'M'],
      answer: 'A',
    },
    // ── Medium ────────────────────────────────────────────────────────────
    {
      id: 'a-m1', difficulty: 'medium',
      type: 'uppercase_match',
      prompt: 'What is the uppercase version of "g"?',
      options: ['q', 'G', 'C', 'Q'],
      answer: 'G',
    },
    {
      id: 'a-m2', difficulty: 'medium',
      type: 'uppercase_match',
      prompt: 'Which letter is the lowercase of "M"?',
      options: ['n', 'w', 'm', 'u'],
      answer: 'm',
    },
    {
      id: 'a-m3', difficulty: 'medium',
      type: 'choose_letter',
      prompt: 'How many vowels are in the English alphabet?',
      options: ['4', '5', '6', '7'],
      answer: '5',
    },
    // ── Hard (dyslexia confusion traps: b/d/p/q) ──────────────────────────
    {
      id: 'a-h1', difficulty: 'hard',
      type: 'confusion_trap',
      prompt: 'Which letter is this? (The letter that sounds like "bee")',
      options: ['d', 'b', 'p', 'q'],
      answer: 'b',
      confusionPairs: [['b', 'd'], ['b', 'p'], ['b', 'q']],
    },
    {
      id: 'a-h2', difficulty: 'hard',
      type: 'confusion_trap',
      prompt: 'Which letter comes BEFORE "e" in the alphabet?',
      options: ['f', 'c', 'd', 'b'],
      answer: 'd',
      confusionPairs: [['d', 'b']],
    },
    {
      id: 'a-h3', difficulty: 'hard',
      type: 'confusion_trap',
      prompt: 'The word "dog" starts with which letter?',
      options: ['b', 'p', 'd', 'q'],
      answer: 'd',
      confusionPairs: [['d', 'b'], ['d', 'p'], ['d', 'q']],
    },
  ],

  phonics: [
    // ── Easy ──────────────────────────────────────────────────────────────
    {
      id: 'p-e1', difficulty: 'easy',
      type: 'word_sound',
      prompt: 'Which word starts with the "sss" sound?',
      options: ['cat', 'sun', 'dog', 'hat'],
      answer: 'sun',
    },
    {
      id: 'p-e2', difficulty: 'easy',
      type: 'word_sound',
      prompt: 'Which word rhymes with "cat"?',
      options: ['dog', 'hat', 'sun', 'big'],
      answer: 'hat',
    },
    {
      id: 'p-e3', difficulty: 'easy',
      type: 'word_sound',
      prompt: 'Which word ends with the "k" sound?',
      options: ['drum', 'ball', 'book', 'tree'],
      answer: 'book',
    },
    // ── Medium ────────────────────────────────────────────────────────────
    {
      id: 'p-m1', difficulty: 'medium',
      type: 'blend',
      prompt: 'What sound do "b" and "r" make together at the start of a word?',
      options: ['br (like bread)', 'bl (like blue)', 'cr (like crab)', 'dr (like drum)'],
      answer: 'br (like bread)',
    },
    {
      id: 'p-m2', difficulty: 'medium',
      type: 'blend',
      prompt: 'Which word has a "sh" sound?',
      options: ['chip', 'ship', 'skip', 'drip'],
      answer: 'ship',
    },
    {
      id: 'p-m3', difficulty: 'medium',
      type: 'word_sound',
      prompt: 'How many syllables does "elephant" have?',
      options: ['2', '3', '4', '1'],
      answer: '3',
    },
    // ── Hard ──────────────────────────────────────────────────────────────
    {
      id: 'p-h1', difficulty: 'hard',
      type: 'digraph',
      prompt: 'The letters "ph" together make which sound?',
      options: ['p sound (like pig)', 'f sound (like fish)', 'ph sound (both p and h)', 'b sound (like bat)'],
      answer: 'f sound (like fish)',
    },
    {
      id: 'p-h2', difficulty: 'hard',
      type: 'digraph',
      prompt: 'Which word has a silent letter?',
      options: ['ship', 'know', 'frog', 'jump'],
      answer: 'know',
    },
    {
      id: 'p-h3', difficulty: 'hard',
      type: 'confusion_trap',
      prompt: 'Which word starts with the same sound as "phone"?',
      options: ['pig', 'photo', 'pick', 'pod'],
      answer: 'photo',
      confusionPairs: [['p', 'b']],
    },
  ],

  vocabulary: [
    // ── Easy ──────────────────────────────────────────────────────────────
    {
      id: 'v-e1', difficulty: 'easy',
      type: 'definition',
      prompt: 'What does "big" mean?',
      options: ['small', 'large', 'fast', 'cold'],
      answer: 'large',
    },
    {
      id: 'v-e2', difficulty: 'easy',
      type: 'definition',
      prompt: 'Which word means the opposite of "hot"?',
      options: ['warm', 'cold', 'nice', 'fast'],
      answer: 'cold',
    },
    {
      id: 'v-e3', difficulty: 'easy',
      type: 'sight_word',
      prompt: 'Which word means "a small child"?',
      options: ['adult', 'baby', 'large', 'quick'],
      answer: 'baby',
    },
    // ── Medium ────────────────────────────────────────────────────────────
    {
      id: 'v-m1', difficulty: 'medium',
      type: 'synonym',
      prompt: 'Which word means the same as "happy"?',
      options: ['sad', 'angry', 'joyful', 'tired'],
      answer: 'joyful',
    },
    {
      id: 'v-m2', difficulty: 'medium',
      type: 'synonym',
      prompt: 'Which word means the same as "begin"?',
      options: ['finish', 'stop', 'start', 'wait'],
      answer: 'start',
    },
    {
      id: 'v-m3', difficulty: 'medium',
      type: 'definition',
      prompt: 'What does "enormous" mean?',
      options: ['tiny', 'very large', 'very fast', 'very cold'],
      answer: 'very large',
    },
    // ── Hard ──────────────────────────────────────────────────────────────
    {
      id: 'v-h1', difficulty: 'hard',
      type: 'context_clue',
      prompt: 'The scientist made a remarkable discovery. "Remarkable" means?',
      options: ['ordinary', 'boring', 'extraordinary', 'small'],
      answer: 'extraordinary',
    },
    {
      id: 'v-h2', difficulty: 'hard',
      type: 'context_clue',
      prompt: 'She was reluctant to go outside in the rain. "Reluctant" means?',
      options: ['excited', 'unwilling', 'happy', 'ready'],
      answer: 'unwilling',
    },
    {
      id: 'v-h3', difficulty: 'hard',
      type: 'synonym',
      prompt: 'Which word is closest in meaning to "courageous"?',
      options: ['afraid', 'brave', 'weak', 'small'],
      answer: 'brave',
    },
  ],

  sentence: [
    // ── Easy ──────────────────────────────────────────────────────────────
    {
      id: 's-e1', difficulty: 'easy',
      type: 'meaning',
      prompt: 'The dog runs fast. What is the dog doing?',
      options: ['sleeping', 'eating', 'running', 'swimming'],
      answer: 'running',
    },
    {
      id: 's-e2', difficulty: 'easy',
      type: 'meaning',
      prompt: 'The cat sat on the mat. Where is the cat?',
      options: ['on a chair', 'on the mat', 'under the table', 'in the tree'],
      answer: 'on the mat',
    },
    {
      id: 's-e3', difficulty: 'easy',
      type: 'grammar',
      prompt: 'Which sentence is correct?',
      options: ['She run fast.', 'She runs fast.', 'She running fast.', 'She runned fast.'],
      answer: 'She runs fast.',
    },
    // ── Medium ────────────────────────────────────────────────────────────
    {
      id: 's-m1', difficulty: 'medium',
      type: 'meaning',
      prompt: 'Tom ate his breakfast quickly because he was late for school. Why did Tom eat quickly?',
      options: ['He was hungry', 'He was late for school', 'The food was cold', 'He did not like it'],
      answer: 'He was late for school',
    },
    {
      id: 's-m2', difficulty: 'medium',
      type: 'grammar',
      prompt: 'Which word correctly completes: "She __ to the park yesterday."',
      options: ['go', 'goes', 'went', 'going'],
      answer: 'went',
    },
    {
      id: 's-m3', difficulty: 'medium',
      type: 'meaning',
      prompt: '"The children laughed and played all afternoon." What mood does this sentence describe?',
      options: ['sad', 'angry', 'happy and playful', 'scared'],
      answer: 'happy and playful',
    },
    // ── Hard ──────────────────────────────────────────────────────────────
    {
      id: 's-h1', difficulty: 'hard',
      type: 'grammar',
      prompt: '"The book was written by the author." This sentence is in which voice?',
      options: ['active voice', 'passive voice', 'future tense', 'question form'],
      answer: 'passive voice',
    },
    {
      id: 's-h2', difficulty: 'hard',
      type: 'meaning',
      prompt: '"Although it was raining, the children decided to go outside." What does this tell us?',
      options: [
        'The children stayed inside',
        'The children went out despite the rain',
        'The rain stopped',
        'The children were afraid',
      ],
      answer: 'The children went out despite the rain',
    },
    {
      id: 's-h3', difficulty: 'hard',
      type: 'grammar',
      prompt: 'Which sentence uses a conjunction correctly?',
      options: [
        'I like cats but I also dogs.',
        'I like cats but I also like dogs.',
        'I like cats, I also like dogs but.',
        'But I like cats I also like dogs.',
      ],
      answer: 'I like cats but I also like dogs.',
    },
  ],

  comprehension: [
    // ── Easy ──────────────────────────────────────────────────────────────
    {
      id: 'c-e1', difficulty: 'easy',
      type: 'passage',
      passage: 'Lily has a red ball. She plays with it every day.',
      prompt: 'What colour is Lily\'s ball?',
      options: ['blue', 'green', 'red', 'yellow'],
      answer: 'red',
    },
    {
      id: 'c-e2', difficulty: 'easy',
      type: 'passage',
      passage: 'Ben likes to eat apples. His favourite fruit is the apple.',
      prompt: 'What is Ben\'s favourite fruit?',
      options: ['banana', 'apple', 'mango', 'grape'],
      answer: 'apple',
    },
    // ── Medium ────────────────────────────────────────────────────────────
    {
      id: 'c-m1', difficulty: 'medium',
      type: 'passage',
      passage: 'Maria woke up early and made breakfast for her family. She cooked eggs and toast. Her family was very happy.',
      prompt: 'Why was Maria\'s family happy?',
      options: [
        'They watched TV',
        'Maria made them breakfast',
        'It was a holiday',
        'They went to the park',
      ],
      answer: 'Maria made them breakfast',
    },
    {
      id: 'c-m2', difficulty: 'medium',
      type: 'passage',
      passage: 'The weather was cold and windy. Jake put on his thick coat and scarf before going outside.',
      prompt: 'Why did Jake put on his coat and scarf?',
      options: [
        'He was going to a party',
        'The weather was cold and windy',
        'He lost his umbrella',
        'His mum told him to',
      ],
      answer: 'The weather was cold and windy',
    },
    // ── Hard ──────────────────────────────────────────────────────────────
    {
      id: 'c-h1', difficulty: 'hard',
      type: 'passage',
      passage: 'The Amazon rainforest is home to millions of species of plants and animals. Scientists believe there are many species yet to be discovered. However, deforestation is threatening this biodiversity. Every year, large areas of forest are cut down for farming and timber.',
      prompt: 'What is the main threat to the Amazon rainforest mentioned in the passage?',
      options: [
        'Climate change',
        'Deforestation',
        'New species discovery',
        'Animal migration',
      ],
      answer: 'Deforestation',
    },
    {
      id: 'c-h2', difficulty: 'hard',
      type: 'passage',
      passage: 'Although Thomas Edison is famous for inventing the lightbulb, he made thousands of attempts before succeeding. He reportedly said that he had not failed, but had found ten thousand ways that did not work.',
      prompt: 'What does Edison\'s quote suggest about his attitude toward failure?',
      options: [
        'He gave up easily',
        'He saw each failure as a learning experience',
        'He was afraid to try again',
        'He asked others for help',
      ],
      answer: 'He saw each failure as a learning experience',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// SECTION QUESTION SELECTION (3 questions per section: 1 easy, 1 medium, 1 hard)
// ─────────────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns the assessment question set: 3 questions per section (easy/medium/hard).
 * @returns {Array<{section, questions: Array}>}
 */
export function buildAssessmentQuestions() {
  return SECTIONS.map(section => {
    const bank = QUESTION_BANK[section];
    const easy   = pickRandom(bank.filter(q => q.difficulty === 'easy'));
    const medium = pickRandom(bank.filter(q => q.difficulty === 'medium'));
    const hard   = pickRandom(bank.filter(q => q.difficulty === 'hard'));
    return { section, questions: [easy, medium, hard] };
  });
}

// ─────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────

/**
 * Scores a single answered question.
 * @param {object} question  - The question object
 * @param {string} chosen    - The user's selected answer
 * @param {number} timeTakenMs - Time taken to answer in ms
 * @returns {{ correct, points, confusedPairs }}
 */
export function scoreQuestion(question, chosen, timeTakenMs = 0) {
  const correct = chosen === question.answer;
  const timeBonus = timeTakenMs < 5000 ? 2 : timeTakenMs < 10000 ? 1 : 0;

  // Detect confusion pairs: which pair was triggered?
  const confusedPairs = [];
  if (!correct && question.confusionPairs) {
    const chosenLetter = chosen?.toLowerCase() || '';
    for (const [a, b] of question.confusionPairs) {
      if (chosenLetter === b && question.answer.toLowerCase() === a) {
        confusedPairs.push({ expected: a, got: b });
      } else if (chosenLetter === a && question.answer.toLowerCase() === b) {
        confusedPairs.push({ expected: b, got: a });
      }
    }
  }

  const difficultyPoints = { easy: 5, medium: 10, hard: 15 };
  const points = correct ? (difficultyPoints[question.difficulty] || 5) + timeBonus : 0;

  return { correct, points, confusedPairs };
}

/**
 * Calculates per-section and overall scores from the answer log.
 * @param {Array} answerLog  - [{ section, question, chosen, timeTakenMs, correct, points, confusedPairs }]
 * @returns {{ sectionScores, overallScore, errorPatterns, totalTimeSec }}
 */
export function calculateScores(answerLog = []) {
  const sectionScores = {};
  let errorPatterns = {};
  let totalTimeSec = 0;

  for (const section of SECTIONS) {
    const answers = answerLog.filter(a => a.section === section);
    if (!answers.length) { sectionScores[section] = 0; continue; }

    const correct = answers.filter(a => a.correct).length;
    sectionScores[section] = Math.round((correct / answers.length) * 100);

    // Merge confusion pairs
    for (const ans of answers) {
      if (ans.confusedPairs?.length) {
        errorPatterns = mergeConfusionHistory(errorPatterns, ans.confusedPairs);
      }
    }

    totalTimeSec += answers.reduce((sum, a) => sum + (a.timeTakenMs || 0), 0) / 1000;
  }

  const sectionVals = Object.values(sectionScores);
  const overallScore = sectionVals.length
    ? Math.round(sectionVals.reduce((a, b) => a + b, 0) / sectionVals.length)
    : 0;

  return {
    sectionScores,
    overallScore,
    errorPatterns,
    totalTimeSec: Math.round(totalTimeSec),
    learningRate: calculateLearningRate(answerLog),
  };
}

/**
 * Calculates learning rate from response times of CORRECT answers.
 * - Fast:    avg < 8s per correct answer
 * - Average: avg 8–18s
 * - Slow:    avg > 18s
 * @param {Array} answerLog
 * @returns {'fast'|'average'|'slow'}
 */
export function calculateLearningRate(answerLog = []) {
  const correctAnswers = answerLog.filter(a => a.correct && a.timeTakenMs > 0);
  if (!correctAnswers.length) return 'average';
  const avgMs = correctAnswers.reduce((s, a) => s + a.timeTakenMs, 0) / correctAnswers.length;
  const avgSec = avgMs / 1000;
  if (avgSec < 8)  return 'fast';
  if (avgSec < 18) return 'average';
  return 'slow';
}

// ─────────────────────────────────────────────────────────────────────
// SKILL LEVEL CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * @param {number} overallScore  0–100
 * @returns {'beginner'|'intermediate'|'advanced'}
 */
export function classifySkillLevel(overallScore) {
  if (overallScore >= 75) return 'advanced';
  if (overallScore >= 50) return 'intermediate';
  return 'beginner';
}

/**
 * Returns an array of section names where the user scored below 50%.
 */
export function detectWeakAreas(sectionScores = {}) {
  return Object.entries(sectionScores)
    .filter(([, score]) => score < 50)
    .map(([section]) => section);
}

/**
 * Returns an array of section names where the user scored >= 75%.
 */
export function detectStrengths(sectionScores = {}) {
  return Object.entries(sectionScores)
    .filter(([, score]) => score >= 75)
    .map(([section]) => section);
}

/**
 * Detects dyslexia risk: returns true if > 30% of total errors are dyslexic-type confusion pairs.
 */
export function detectDyslexiaRisk(answerLog = [], errorPatterns = {}) {
  const totalErrors = answerLog.filter(a => !a.correct).length;
  if (!totalErrors) return false;
  const dyslexicErrors = Object.values(errorPatterns).reduce((s, v) => s + v, 0);
  return dyslexicErrors / totalErrors > 0.3;
}

// ─────────────────────────────────────────────────────────────────────
// LEARNING PATH GENERATOR
// ─────────────────────────────────────────────────────────────────────

const ACTIVITY_MAP = {
  alphabet:       { route: '/reading',  label: 'Alphabet Practice', icon: '🔤', type: 'reading' },
  phonics:        { route: '/speech',   label: 'Phonics & Speech',  icon: '🔊', type: 'speech' },
  vocabulary:     { route: '/games',    label: 'Vocabulary Games',  icon: '📝', type: 'games' },
  sentence:       { route: '/reading',  label: 'Sentence Reading',  icon: '📖', type: 'reading' },
  comprehension:  { route: '/reading',  label: 'Comprehension',     icon: '🧠', type: 'reading' },
};

/**
 * Generates an ordered learning path based on classification results.
 *
 * Rules:
 * - Weak areas (score < 50%) appear first and are marked "priority"
 * - Sections with score 50–74% appear next ("practice")
 * - Sections with score >= 75% appear last ("review")
 * - If skill level is 'advanced', basics (alphabet) are de-prioritized
 *
 * @returns {Array<{ section, route, label, icon, type, priority, score }>}
 */
export function generateLearningPath(sectionScores = {}, skillLevel = 'beginner') {
  const allSections = [...SECTIONS];

  // Sort: weak first, then mid, then strong
  allSections.sort((a, b) => {
    const sa = sectionScores[a] ?? 0;
    const sb = sectionScores[b] ?? 0;
    return sa - sb;
  });

  // Advanced users skip alphabet basics
  const filtered = skillLevel === 'advanced'
    ? allSections.filter(s => s !== 'alphabet')
    : allSections;

  return filtered.map(section => {
    const score = sectionScores[section] ?? 0;
    const priority = score < 50 ? 'high' : score < 75 ? 'medium' : 'low';
    const activity = ACTIVITY_MAP[section];

    return {
      section,
      route: activity.route,
      label: activity.label,
      icon: activity.icon,
      type: activity.type,
      priority,
      score,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// SUPABASE PERSISTENCE
// ─────────────────────────────────────────────────────────────────────

/**
 * Saves assessment results to Supabase.
 */
export async function saveAssessmentResults(userId, { sectionScores, overallScore, totalTimeSec, errorPatterns, answerLog, learningRate }) {
  if (!userId) return;
  try {
    const { error } = await supabase.from('assessment_results').insert([{
      user_id:             userId,
      alphabet_score:      sectionScores.alphabet      ?? 0,
      phonics_score:       sectionScores.phonics       ?? 0,
      vocabulary_score:    sectionScores.vocabulary    ?? 0,
      sentence_score:      sectionScores.sentence      ?? 0,
      comprehension_score: sectionScores.comprehension ?? 0,
      overall_score:       overallScore,
      time_taken_sec:      totalTimeSec,
      learning_rate:       learningRate || 'average',
      error_patterns:      errorPatterns,
      raw_answers:         answerLog,
    }]);
    if (error) console.error('[AssessmentService] saveAssessmentResults error:', error.message);
  } catch (e) {
    console.error('[AssessmentService] saveAssessmentResults exception:', e);
  }
}

/**
 * Upserts user_profile with classification + learning path.
 */
export async function saveUserProfile(userId, profile) {
  if (!userId) return;
  try {
    const { error } = await supabase.from('user_profile').upsert({
      user_id:           userId,
      skill_level:       profile.skillLevel,
      strengths:         profile.strengths,
      weak_areas:        profile.weakAreas,
      dyslexia_patterns: profile.errorPatterns,
      learning_path:     profile.learningPath,
      learning_rate:     profile.learningRate || 'average',
      xp:                profile.xp ?? 0,
      badges:            profile.badges ?? [],
      assessment_done:   true,
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) console.error('[AssessmentService] saveUserProfile error:', error.message);
  } catch (e) {
    console.error('[AssessmentService] saveUserProfile exception:', e);
  }
}

/**
 * Fetches the user_profile from Supabase.
 * Returns null if not found.
 */
export async function fetchUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_profile')
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
 * Checks whether the user has completed the assessment.
 */
export async function hasCompletedAssessment(userId) {
  if (!userId) return false;
  const profile = await fetchUserProfile(userId);
  return profile?.assessment_done === true;
}

/**
 * Updates user_profile after each exercise session (recalculates weak areas).
 */
export async function updateUserProfileFromSession(userId, sessionData) {
  if (!userId) return;
  const profile = await fetchUserProfile(userId);
  if (!profile) return;

  // Merge new confusion patterns
  const merged = mergeConfusionHistory(
    profile.dyslexia_patterns || {},
    sessionData.confusedLetters || []
  );

  // Recompute XP
  const newXP = (profile.xp || 0) + (sessionData.xpEarned || 0);

  // Award badges
  const badges = new Set(profile.badges || []);
  if (newXP >= 100) badges.add('XP Hero 🏅');
  if (newXP >= 500) badges.add('XP Master 🥇');
  if (sessionData.accuracy >= 90) badges.add('Accuracy Star ⭐');

  try {
    const { error } = await supabase.from('user_profile').upsert({
      user_id:          userId,
      skill_level:      profile.skill_level,
      dyslexia_patterns: merged,
      xp:               newXP,
      badges:           [...badges],
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) console.error('[AssessmentService] updateUserProfileFromSession error:', error.message);
  } catch (e) {
    console.error('[AssessmentService] updateUserProfileFromSession exception:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────
// LOCALSTORE FALLBACK (guests / offline)
// ─────────────────────────────────────────────────────────────────────

const PROFILE_KEY = 'lexilearn_user_profile';

export function saveUserProfileLocally(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, assessment_done: true }));
    window.dispatchEvent(new Event('lexilearn:profile'));
  } catch (e) {
    console.warn('[AssessmentService] localStorage save failed:', e);
  }
}

export function getUserProfileLocally() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasCompletedAssessmentLocally() {
  const profile = getUserProfileLocally();
  return profile?.assessment_done === true;
}

// ─────────────────────────────────────────────────────────────────────
// SKILL LEVEL DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────

export const SKILL_LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner',
    emoji: '🌱',
    color: '#5DD87A',
    bgColor: 'rgba(93,216,122,0.12)',
    borderColor: 'rgba(93,216,122,0.35)',
    description: 'You\'re just starting your learning journey!',
  },
  intermediate: {
    label: 'Intermediate',
    emoji: '🚀',
    color: '#4DAAFF',
    bgColor: 'rgba(77,170,255,0.12)',
    borderColor: 'rgba(77,170,255,0.35)',
    description: 'You have a good foundation — keep building!',
  },
  advanced: {
    label: 'Advanced',
    emoji: '⭐',
    color: '#FFD15E',
    bgColor: 'rgba(255,209,94,0.12)',
    borderColor: 'rgba(255,209,94,0.35)',
    description: 'Excellent skills! You\'re ready for complex challenges.',
  },
};

export const SECTION_SCORE_LABEL = (score) => {
  if (score >= 75) return { label: 'Strong 💪', color: '#5DD87A' };
  if (score >= 50) return { label: 'Good 👍',   color: '#4DAAFF' };
  if (score >= 25) return { label: 'Needs Work ⚠️', color: '#FFD15E' };
  return             { label: 'Struggling 🔄', color: '#FF7B7B' };
};
