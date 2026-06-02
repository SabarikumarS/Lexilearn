/**
 * dyslexiaEngine.js
 * ─────────────────────────────────────────────────────────────
 * Core engine for dyslexia-aware letter confusion detection,
 * accuracy calculation, adaptive content selection, and feedback.
 */

// ──────────────────────────────────────────────────────────────
// CONFUSION PAIRS
// ──────────────────────────────────────────────────────────────

/**
 * Canonical dyslexic confusion groups.
 * Each group is an array of letters that are commonly confused.
 */
export const CONFUSION_GROUPS = [
  ['b', 'd'],
  ['p', 'q'],
  ['m', 'n'],
  ['u', 'v'],
  ['w', 'v', 'v'],   // w ↔ vv (approximation)
  ['i', 'j', 'l'],
  ['o', 'a', 'e'],
];

/**
 * Flat map: letter → set of letters it is commonly confused with.
 * e.g. confusionMap['b'] = new Set(['d'])
 */
export const confusionMap = (() => {
  const map = {};
  for (const group of CONFUSION_GROUPS) {
    for (const letter of group) {
      if (!map[letter]) map[letter] = new Set();
      for (const other of group) {
        if (other !== letter) map[letter].add(other);
      }
    }
  }
  return map;
})();

/**
 * Returns true if letterA and letterB are in the same confusion group.
 */
export function areDyslexicConfusions(a, b) {
  return confusionMap[a]?.has(b) ?? false;
}

// ──────────────────────────────────────────────────────────────
// CORE ANALYSIS
// ──────────────────────────────────────────────────────────────

/**
 * Char-by-char comparison that detects dyslexic letter confusion.
 *
 * @param {string} expected  The correct text
 * @param {string} spoken    What the user said/typed (after STT or input)
 * @returns {{
 *   hits: number,
 *   misses: number,
 *   confusedLetters: Array<{expected: string, got: string, position: number}>,
 *   accuracy: number,
 *   dyslexiaScore: number,   // 0-100 — how dyslexic the errors are (vs random)
 *   letterBreakdown: Object  // per-letter stats
 * }}
 */
export function analyzeDyslexicConfusion(expected = '', spoken = '') {
  console.log('[DyslexiaEngine] analyzeDyslexicConfusion called', { expected, spoken });

  const normExp = expected.toLowerCase().replace(/[^a-z]/g, '');
  const normSpk = spoken.toLowerCase().replace(/[^a-z]/g, '');

  const totalLetters = normExp.length;
  if (totalLetters === 0) {
    return { hits: 0, misses: 0, confusedLetters: [], accuracy: 100, dyslexiaScore: 0, letterBreakdown: {} };
  }

  let hits    = 0;
  let misses  = 0;
  let dyslexicErrors = 0;
  const confusedLetters = [];
  const letterBreakdown = {};

  const compareLen = Math.max(normExp.length, normSpk.length);

  for (let i = 0; i < compareLen; i++) {
    const expChar = normExp[i] ?? '';
    const spkChar = normSpk[i] ?? '';

    if (!expChar) break; // beyond expected — stop counting

    // Track per-letter stats
    if (!letterBreakdown[expChar]) {
      letterBreakdown[expChar] = { total: 0, correct: 0, confused: 0 };
    }
    letterBreakdown[expChar].total++;

    if (expChar === spkChar) {
      // ✅ Correct
      hits++;
      letterBreakdown[expChar].correct++;
      console.log(`[DyslexiaEngine] Pos ${i}: '${expChar}' ✓`);
    } else {
      // ❌ Wrong
      misses++;
      const isDyslexic = spkChar && areDyslexicConfusions(expChar, spkChar);

      if (isDyslexic) {
        dyslexicErrors++;
        letterBreakdown[expChar].confused++;
        confusedLetters.push({ expected: expChar, got: spkChar, position: i });
        console.log(`[DyslexiaEngine] Pos ${i}: '${expChar}' confused with '${spkChar}' (dyslexic pair)`);
      } else {
        console.log(`[DyslexiaEngine] Pos ${i}: '${expChar}' → '${spkChar || '(missing)'}' (generic error)`);
      }
    }
  }

  // accuracy = (correct_letters / total_letters) * 100
  const accuracy = Math.round((hits / totalLetters) * 100);

  // dyslexiaScore — what proportion of errors are dyslexic-type
  const dyslexiaScore = misses > 0
    ? Math.round((dyslexicErrors / misses) * 100)
    : 0;

  console.log('[DyslexiaEngine] Result:', { hits, misses, accuracy, dyslexiaScore, confusedLetters });

  return { hits, misses, confusedLetters, accuracy, dyslexiaScore, letterBreakdown };
}

// ──────────────────────────────────────────────────────────────
// FEEDBACK GENERATION
// ──────────────────────────────────────────────────────────────

/**
 * Returns a human-readable feedback string based on confused letters.
 * @param {Array<{expected: string, got: string}>} confusedLetters
 * @returns {string[]}  Array of suggestion strings
 */
export function getConfusionFeedback(confusedLetters = []) {
  if (!confusedLetters.length) return [];

  // Aggregate by pair
  const pairCounts = {};
  for (const { expected, got } of confusedLetters) {
    const key = [expected, got].sort().join('↔');
    pairCounts[key] = (pairCounts[key] || 0) + 1;
  }

  const suggestions = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pair, count]) => {
      const [a, b] = pair.split('↔');
      return `You confused "${a.toUpperCase()}" and "${b.toUpperCase()}" ${count} time${count > 1 ? 's' : ''}`;
    });

  console.log('[DyslexiaEngine] Confusion feedback:', suggestions);
  return suggestions;
}

/**
 * Returns a cheerful, contextual message based on accuracy and confusion.
 * @param {number} accuracy          0–100
 * @param {Array}  confusedLetters   Output of analyzeDyslexicConfusion
 * @returns {string}
 */
export function getCheerfulMessage(accuracy, confusedLetters = []) {
  console.log('[DyslexiaEngine] getCheerfulMessage:', { accuracy, confusedPairs: confusedLetters.length });

  // Get the most-confused pair
  const topPair = getMostConfusedPair(confusedLetters);

  if (accuracy >= 90) {
    const messages = [
      "🌟 Outstanding! You're a reading superstar!",
      "🎉 Perfect! You nailed every letter!",
      "🚀 Amazing work! You're improving so fast!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (accuracy >= 75) {
    if (topPair) {
      return `🎉 Great job! Just keep an eye on '${topPair[0].toUpperCase()}' and '${topPair[1].toUpperCase()}'!`;
    }
    return "👍 Really good! You're getting better every time!";
  }

  if (accuracy >= 50) {
    if (topPair) {
      return `💪 Nice try! Let's focus on '${topPair[0].toUpperCase()}' and '${topPair[1].toUpperCase()}' next!`;
    }
    return "💪 Keep going! You're making great progress!";
  }

  if (topPair) {
    return `🔄 Let's practise '${topPair[0].toUpperCase()}' vs '${topPair[1].toUpperCase()}' — you've got this!`;
  }
  return "🔄 Let's try again — you're getting there!";
}

/**
 * Returns the most-confused letter pair [a, b] or null.
 */
function getMostConfusedPair(confusedLetters = []) {
  if (!confusedLetters.length) return null;
  const pairCounts = {};
  for (const { expected, got } of confusedLetters) {
    const key = [expected, got].sort().join(',');
    pairCounts[key] = (pairCounts[key] || 0) + 1;
  }
  const top = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0].split(',') : null;
}

// ──────────────────────────────────────────────────────────────
// ADAPTIVE CONTENT SELECTION
// ──────────────────────────────────────────────────────────────

/**
 * Returns a word-frequency weighting map for adaptive content selection.
 * Words containing frequently confused letters get higher weight.
 *
 * @param {Object} confusionHistory  { 'b,d': 5, 'p,q': 2, ... }  (pair → count)
 * @param {string[]} wordPool        Candidate words to score
 * @returns {Array<{word: string, weight: number}>}  Sorted by weight desc
 */
export function pickDyslexicWords(confusionHistory = {}, wordPool = []) {
  console.log('[DyslexiaEngine] pickDyslexicWords called, history pairs:', Object.keys(confusionHistory).length);

  // Build per-letter weight from confusion history
  const letterWeight = {};
  for (const [pair, count] of Object.entries(confusionHistory)) {
    const [a, b] = pair.split(',');
    letterWeight[a] = (letterWeight[a] || 0) + count;
    letterWeight[b] = (letterWeight[b] || 0) + count;
  }

  const scored = wordPool.map(word => {
    const letters = word.toLowerCase().replace(/[^a-z]/g, '').split('');
    const weight  = letters.reduce((sum, ch) => sum + (letterWeight[ch] || 0), 0);
    return { word, weight };
  });

  // Sort by weight descending, then shuffle within ties
  scored.sort((a, b) => b.weight - a.weight);
  console.log('[DyslexiaEngine] Top weighted words:', scored.slice(0, 5).map(s => `${s.word}(${s.weight})`));
  return scored;
}

// ──────────────────────────────────────────────────────────────
// CONFUSION HISTORY HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Merges new confused letters into an existing confusion history object.
 * @param {Object} existing   { 'b,d': 3 }
 * @param {Array}  newItems   Output confusedLetters from analyzeDyslexicConfusion
 * @returns {Object}  Updated history
 */
export function mergeConfusionHistory(existing = {}, newItems = []) {
  const updated = { ...existing };
  for (const { expected, got } of newItems) {
    const key = [expected, got].sort().join(',');
    updated[key] = (updated[key] || 0) + 1;
  }
  console.log('[DyslexiaEngine] Merged confusion history:', updated);
  return updated;
}

/**
 * Returns sorted array of {pair, count} from confusion history.
 */
export function getSortedConfusions(confusionHistory = {}) {
  return Object.entries(confusionHistory)
    .map(([pair, count]) => {
      const [a, b] = pair.split(',');
      return { pair, a, b, count };
    })
    .sort((x, y) => y.count - x.count);
}

// ──────────────────────────────────────────────────────────────
// DYSLEXIA DIFFICULTY LEVEL
// ──────────────────────────────────────────────────────────────

/**
 * Returns a 0–3 dyslexia severity based on confusion history totals.
 * 0 = no pattern, 1 = mild, 2 = moderate, 3 = severe
 */
export function getDyslexiaSeverity(confusionHistory = {}) {
  const totalErrors = Object.values(confusionHistory).reduce((s, v) => s + v, 0);
  if (totalErrors >= 20) return 3;
  if (totalErrors >= 10) return 2;
  if (totalErrors >= 3)  return 1;
  return 0;
}

export const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Significant'];
export const SEVERITY_COLORS = ['#5DD87A', '#FFD15E', '#FF9A5E', '#FF7B7B'];
