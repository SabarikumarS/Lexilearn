import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';
import AnimatedButton from '../components/AnimatedButton';
import SpeechRecorder from '../components/SpeechRecorder';
import CelebrationModal from '../components/CelebrationModal';
import { logSpeechSession, saveAttemptToSupabase, syncProgressSummary, logConfusionPattern } from '../services/progressService';
import { getAdaptivePrompt } from '../services/adaptiveLearning';
import {
  analyzeDyslexicConfusion,
  getCheerfulMessage,
  getConfusionFeedback,
} from '../services/dyslexiaEngine';

// ────────────────────────────────────────────────────────────
// CONTENT
// ────────────────────────────────────────────────────────────
const LEVELS = [
  { id: 1, label: '⭐ Level 1 – Easy',       color: '#5DD87A', bg: '#EDFFF5' },
  { id: 2, label: '⭐⭐ Level 2 – Medium',   color: '#4DAAFF', bg: '#EEF6FF' },
  { id: 3, label: '⭐⭐⭐ Level 3 – Hard',   color: '#B07FFF', bg: '#F4EEFF' },
];

const PROMPTS = {
  1: [
    { id:1,  text: 'The cat sat on the mat' },
    { id:2,  text: 'I can read a book' },
    { id:3,  text: 'The dog runs fast' },
    { id:4,  text: 'I like apples and bananas' },
    { id:5,  text: 'The sun is big and bright' },
    { id:6,  text: 'Sam has a red hat' },
    { id:7,  text: 'The fish swim in the sea' },
    { id:8,  text: 'Mum and dad are happy' },
  ],
  2: [
    { id:9,  text: 'The bright sun is shining today' },
    { id:10, text: 'She ran quickly across the park' },
    { id:11, text: 'I love reading stories at bedtime' },
    { id:12, text: 'The elephant has a long trunk' },
    { id:13, text: 'We played football in the garden' },
    { id:14, text: 'The rainbow has seven colours' },
    { id:15, text: 'Please pass me the orange juice' },
    { id:16, text: 'My favourite animal is the dolphin' },
  ],
  3: [
    { id:17, text: 'The astronaut floated in outer space' },
    { id:18, text: 'She carefully painted a beautiful landscape' },
    { id:19, text: 'The mysterious forest was full of ancient trees' },
    { id:20, text: 'He discovered a treasure chest beneath the ocean waves' },
    { id:21, text: 'The scientist invented a remarkable new machine' },
    { id:22, text: 'Lightning flashed across the stormy purple sky' },
    { id:23, text: 'The clever fox outsmarted the enormous wolf' },
    { id:24, text: 'She bravely climbed to the top of the highest mountain' },
  ],
};

// ────────────────────────────────────────────────────────────
// SCORE RING
// ────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius     = 44;
  const circ       = 2 * Math.PI * radius;
  const dashOffset = circ - (score / 100) * circ;
  const color      = score >= 80 ? '#5DD87A' : score >= 50 ? '#FFD15E' : '#FF7B7B';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} className="score-ring-track" />
        <circle cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 55 55)"
          style={{ transition:'stroke-dashoffset 1s ease' }}
        />
        <text x="55" y="55" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="20" fontWeight="800" fontFamily="Nunito, sans-serif">
          {score}%
        </text>
      </svg>
      <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-muted)' }}>Overall Score</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3-METRIC BARS
// ────────────────────────────────────────────────────────────
function MetricBars({ metrics }) {
  const bars = [
    { label: 'Accuracy',    value: metrics.accuracy,    color: '#4DAAFF', emoji: '🎯' },
    { label: 'Correctness', value: metrics.correctness, color: '#B07FFF', emoji: '✅' },
    { label: 'Speed',       value: metrics.speed,       color: '#5DD87A', emoji: '⚡' },
  ];
  return (
    <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'0.7rem' }}>
      {bars.map(bar => (
        <div key={bar.label}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', fontWeight:700, marginBottom:'0.2rem', color:'var(--text-main)' }}>
            <span>{bar.emoji} {bar.label}</span>
            <span style={{ color: bar.color }}>{bar.value}%</span>
          </div>
          <div className="metric-bar-track">
            <div style={{
              height:'100%', width:`${bar.value}%`, borderRadius:'6px',
              background:`linear-gradient(90deg, ${bar.color}, ${bar.color}cc)`,
              transition:'width 1s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONFUSION BADGES
// ────────────────────────────────────────────────────────────
function ConfusionBadges({ confusedLetters = [] }) {
  if (!confusedLetters.length) return null;

  // Aggregate by pair
  const pairs = {};
  for (const { expected, got } of confusedLetters) {
    const key = [expected, got].sort().join(' ↔ ');
    pairs[key] = (pairs[key] || 0) + 1;
  }

  return (
    <div style={{ width: '100%', marginTop: '0.5rem' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        🔤 Letter confusions detected:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {Object.entries(pairs).map(([pair, count]) => (
          <span key={pair} className="confusion-badge">
            {pair.toUpperCase()} × {count}
          </span>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CHEERFUL FEEDBACK POPUP
// ────────────────────────────────────────────────────────────
function FeedbackPopup({ message, score, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = score >= 80
    ? 'linear-gradient(135deg, #5DD87A, #3ECFA8)'
    : score >= 50
    ? 'linear-gradient(135deg, #FFD15E, #FF9A5E)'
    : 'linear-gradient(135deg, #B07FFF, #4DAAFF)';

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: `translateX(-50%) scale(${visible ? 1 : 0.85})`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 9999,
      background: bg,
      borderRadius: 'var(--radius-lg)',
      padding: '1.2rem 2.5rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      textAlign: 'center',
      minWidth: '300px',
      maxWidth: '90vw',
      color: score >= 50 && score < 80 ? '#3a2000' : 'white',
    }}>
      <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: 1.4 }}>{message}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────
export default function SpeechPractice() {
  const navigate  = useNavigate();
  const { user, isGuest, signOut } = useAuth();

  const [selectedLevel,   setSelectedLevel]   = useState(null);
  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [result,          setResult]          = useState(null);
  const [celebration,     setCelebration]     = useState(false);
  const [aiAdvice,        setAiAdvice]        = useState(null);
  const [recentAttempts,  setRecentAttempts]  = useState([]);
  const [popup,           setPopup]           = useState(null);   // { message, score }
  const [consecutiveHigh, setConsecutiveHigh] = useState(0);
  const [levelUpHint,     setLevelUpHint]     = useState(false);
  // Dyslexia state
  const [dyslexiaData,    setDyslexiaData]    = useState(null);  // { confusedLetters, accuracy }

  const audioEndTimeRef = useRef(null);

  const prompts   = selectedLevel ? PROMPTS[selectedLevel] : [];
  const prompt    = prompts[currentIdx];
  const isLast    = currentIdx === prompts.length - 1;
  const levelMeta = LEVELS.find(l => l.id === selectedLevel);

  // Called by AudioPlayer when playback finishes (start of user response window)
  const handleAudioEnd = () => {
    audioEndTimeRef.current = performance.now();
  };

  const handleResult = async (rawResult) => {
    const { transcript, evaluated, score, deepseekFeedback, easierAlternative } = rawResult;
    const spoken = transcript || '';

    // ── Dyslexia letter-level analysis ──────────────────────────────────────
    console.log('[SpeechPractice] Running dyslexia confusion analysis...');
    const dyslexis = analyzeDyslexicConfusion(prompt.text, spoken);
    console.log('[SpeechPractice] Dyslexia result:', dyslexis);
    setDyslexiaData(dyslexis);

    // ── Combined score: speech 60% + letter accuracy 40% ────────────────────
    const speechScore   = score ?? 0;
    const letterScore   = dyslexis.accuracy;
    const combinedScore = Math.round(speechScore * 0.6 + letterScore * 0.4);
    console.log('[SpeechPractice] Scores — speech:', speechScore, '| letter:', letterScore, '| combined:', combinedScore);

    const newResult = { ...rawResult, score: combinedScore };
    setResult(newResult);

    // ── Contextual cheerful popup ────────────────────────────────────────────
    const cheerfulMsg = getCheerfulMessage(combinedScore, dyslexis.confusedLetters);
    setPopup({ message: cheerfulMsg, score: combinedScore });

    // ── Adaptive difficulty tracking ─────────────────────────────────────────
    const newStreak = combinedScore >= 80 ? consecutiveHigh + 1 : 0;
    setConsecutiveHigh(newStreak);
    setLevelUpHint(newStreak >= 2 && selectedLevel < 3);

    // ── LocalStorage progress ────────────────────────────────────────────────
    logSpeechSession(combinedScore, spoken, prompt.text);
    logConfusionPattern(dyslexis.confusedLetters, dyslexis.accuracy);

    // ── Track for AI recommendations ────────────────────────────────────────
    const attempt = {
      score:        combinedScore,
      accuracy:     evaluated?.accuracy    ?? 0,
      correctness:  evaluated?.correctness ?? 0,
      responseTime: evaluated?.responseTime?? 0,
      dyslexiaAccuracy: dyslexis.accuracy,
      type: 'speech',
    };
    const updatedAttempts = [...recentAttempts, attempt].slice(-5);
    setRecentAttempts(updatedAttempts);

    // ── Supabase (logged-in users only) ─────────────────────────────────────
    if (!isGuest && user) {
      console.log('[SpeechPractice] Saving attempt to Supabase for user:', user.id);
      await saveAttemptToSupabase(user.id, {
        type:            'speech',
        level:           selectedLevel,
        score:           combinedScore,
        accuracy:        evaluated?.accuracy,
        correctness:     evaluated?.correctness,
        responseTime:    evaluated?.responseTime,
        expectedText:    prompt.text,
        spokenText:      spoken,
        confusedLetters: dyslexis.confusedLetters,
        dyslexiaAccuracy:dyslexis.accuracy,
      });
      syncProgressSummary(user.id);
    } else {
      console.log('[SpeechPractice] Guest mode — skipping Supabase write.');
    }

    // ── AI adaptive recommendation (async, only when struggling) ────────────
    if (combinedScore < 65) {
      getAdaptivePrompt(user?.id, selectedLevel, updatedAttempts)
        .then(advice => {
          setAiAdvice({
            ...advice,
            easierAlternative: easierAlternative || advice.easierAlternative,
          });
        })
        .catch(() => {});
    } else {
      setAiAdvice(null);
    }
  };

  const handleNext = () => {
    setAiAdvice(null);
    setLevelUpHint(false);
    setDyslexiaData(null);
    if (isLast) {
      setCelebration(true);
    } else {
      setCurrentIdx(i => i + 1);
      setResult(null);
    }
  };

  const handleCelebClose = () => {
    setCelebration(false);
    setSelectedLevel(null);
    setCurrentIdx(0);
    setResult(null);
    setAiAdvice(null);
    setRecentAttempts([]);
    setConsecutiveHigh(0);
    setLevelUpHint(false);
    setDyslexiaData(null);
  };

  // ── LEVEL SELECTION ──────────────────────────────────────
  if (!selectedLevel) {
    return (
      <div className="app-container">
        <Navbar user={user} onLogout={signOut} />
        <main style={{ flex:1, padding:'2rem', maxWidth:'800px', margin:'0 auto', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:'2rem' }}>
            <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/')}>⬅️ Home</AnimatedButton>
            <h1 style={{ flex:1, textAlign:'center', fontSize:'2.2rem', color:'var(--color-success)' }}>
              Speech Practice 🎤
            </h1>
            <div style={{ width:'80px' }} />
          </div>

          {/* Guest notice */}
          {isGuest && (
            <div style={{
              textAlign:'center', padding:'0.8rem 1.2rem', marginBottom:'1.5rem',
              background:'rgba(77,170,255,0.1)', borderRadius:'var(--radius-md)',
              border:'1.5px solid rgba(77,170,255,0.3)', fontSize:'0.9rem', color:'var(--text-muted)',
            }}>
              <strong>👤 Guest Mode</strong> — Your scores won't be saved.{' '}
              <span onClick={() => navigate('/login')} style={{ color:'var(--color-primary)', cursor:'pointer', fontWeight:700 }}>
                Sign in to track progress →
              </span>
            </div>
          )}

          <p style={{ textAlign:'center', color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.1rem' }}>
            Choose a difficulty level to start practising!
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', maxWidth:'500px', margin:'0 auto' }}>
            {LEVELS.map(level => (
              <div key={level.id}
                className="speech-level-card hover-lift"
                onClick={() => { setSelectedLevel(level.id); setCurrentIdx(0); setResult(null); }}
                style={{
                  background: level.bg,
                  border:`2px solid ${level.color}40`,
                }}
              >
                <div style={{ fontSize:'2.5rem' }}>{level.id === 1 ? '🐢' : level.id === 2 ? '🐇' : '🚀'}</div>
                <div>
                  <h3 style={{ fontSize:'1.3rem', color: level.color, marginBottom:'0.2rem', fontWeight:800 }}>{level.label}</h3>
                  <p style={{ fontSize:'0.95rem', color:'var(--text-muted)', fontWeight:600 }}>{PROMPTS[level.id]?.length} prompts</p>
                </div>
                <div style={{ marginLeft:'auto', fontSize:'1.5rem', color:'var(--text-muted)' }}>→</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── PRACTICE SCREEN ──────────────────────────────────────
  return (
    <div className="app-container">
      <Navbar user={user} onLogout={signOut} />

      {/* Level-complete celebration */}
      {celebration && (
        <CelebrationModal
          onClose={handleCelebClose}
          score={result ? result.score : 100}
          title="Level Complete! 🎤"
          subtitle="Amazing pronunciation work!"
        />
      )}

      {/* Cheerful per-attempt popup */}
      {popup && (
        <FeedbackPopup
          message={popup.message}
          score={popup.score}
          onDone={() => setPopup(null)}
        />
      )}

      <main style={{ flex:1, padding:'2rem', maxWidth:'760px', margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', gap:'1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <AnimatedButton variant="ghost" size="sm" onClick={() => { setSelectedLevel(null); setResult(null); }}>
            ⬅️ Levels
          </AnimatedButton>
          <h1 style={{ flex:1, textAlign:'center', fontSize:'2rem', color: levelMeta?.color }}>
            {levelMeta?.label}
          </h1>
          <div style={{ width:'80px' }} />
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.9rem', color:'var(--text-muted)', fontWeight:600 }}>
            <span>Prompt {currentIdx + 1} of {prompts.length}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              background:`linear-gradient(90deg, ${levelMeta?.color}, ${levelMeta?.color}cc)`,
              width:`${((currentIdx + 1) / prompts.length) * 100}%`,
              transition:'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Prompt card */}
        <div className="glass-panel animate-fade-in" style={{ padding:'2.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'2rem' }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.75rem', fontWeight:600 }}>
              🔊 Listen first, then repeat!
            </p>
            <h2 style={{
              fontSize:'2.2rem', textAlign:'center',
              color:'var(--text-main)', fontFamily:'var(--font-primary)',
              lineHeight:1.5, letterSpacing:'1px',
              padding:'0.5rem 1.5rem',
              background: `${levelMeta?.color}12`,
              borderRadius:'var(--radius-md)',
              border:`2px solid ${levelMeta?.color}30`
            }}>
              "{prompt.text}"
            </h2>
          </div>

          <AudioPlayer text={prompt.text} onEnd={handleAudioEnd} />

          <div style={{ width:'100%', height:'1.5px', background:'rgba(0,0,0,0.06)' }} />

          <SpeechRecorder
            key={prompt.id}
            expectedText={prompt.text}
            onResult={handleResult}
            startTime={audioEndTimeRef.current}
          />

          {/* Result feedback */}
          {result && (
            <div className="animate-fade-in" style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem' }}>
              <ScoreRing score={result.score} />

              {/* 3-metric breakdown */}
              {result.evaluated && (
                <MetricBars metrics={result.evaluated.metrics} />
              )}

              {/* Dyslexia accuracy pill */}
              {dyslexiaData && (
                <div style={{
                  width:'100%', padding:'0.9rem 1.4rem',
                  background:'linear-gradient(135deg, rgba(176,127,255,0.1), rgba(77,170,255,0.1))',
                  borderRadius:'var(--radius-md)',
                  border:'1.5px solid rgba(176,127,255,0.3)',
                  display:'flex', flexDirection:'column', gap:'0.6rem',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:800, fontSize:'0.9rem', color:'#7B6FFF' }}>
                      🧠 Letter-Level Accuracy
                    </span>
                    <span style={{
                      fontWeight:900, fontSize:'1.1rem', color:'#7B6FFF',
                      background:'rgba(176,127,255,0.15)', padding:'2px 12px',
                      borderRadius:'var(--radius-full)',
                    }}>
                      {dyslexiaData.accuracy}%
                    </span>
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', gap:'1rem' }}>
                    <span>✅ Hits: <strong>{dyslexiaData.hits}</strong></span>
                    <span>❌ Misses: <strong>{dyslexiaData.misses}</strong></span>
                  </div>
                  {/* Confusion badges */}
                  <ConfusionBadges confusedLetters={dyslexiaData.confusedLetters} />
                </div>
              )}

              {/* Score banner */}
              <div style={{
                width:'100%', padding:'1.5rem',
                background: result.score >= 80
                  ? 'linear-gradient(135deg, #5DD87A, #3ECFA8)'
                  : result.score >= 50
                  ? 'linear-gradient(135deg, #FFD15E, #FF9A5E)'
                  : 'linear-gradient(135deg, #FF7B7B, #FF4444)',
                borderRadius:'var(--radius-md)',
                textAlign:'center',
                color: result.score >= 50 && result.score < 80 ? '#3a2000' : 'white',
                boxShadow:'var(--shadow-md)'
              }}>
                <h3 style={{ fontSize:'1.8rem', marginBottom:'0.35rem' }}>
                  {result.score >= 80 ? '🎉 Excellent!' : result.score >= 50 ? '👍 Good Try!' : '🔄 Keep Practising!'}
                </h3>
                {result.transcript && (
                  <p style={{ opacity:0.85, fontSize:'1rem' }}>You said: "{result.transcript}"</p>
                )}
                {result.evaluated && (
                  <p style={{ opacity:0.75, fontSize:'0.85rem', marginTop:'0.4rem' }}>
                    ⚡ Response time: {result.evaluated.responseTime}s
                  </p>
                )}
              </div>

              {/* Level-up hint */}
              {levelUpHint && (
                <div className="animate-fade-in" style={{
                  width:'100%', padding:'1rem 1.5rem',
                  background:'linear-gradient(135deg, rgba(93,216,122,0.15), rgba(62,207,168,0.15))',
                  borderRadius:'var(--radius-md)',
                  border:'1.5px solid rgba(93,216,122,0.4)',
                  textAlign:'center',
                }}>
                  <p style={{ fontWeight:800, fontSize:'1.05rem', color:'#3ECFA8' }}>
                    🚀 You're on a roll! Ready for the next level?
                  </p>
                  {selectedLevel < 3 && (
                    <AnimatedButton
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setSelectedLevel(l => Math.min(l + 1, 3));
                        setCurrentIdx(0);
                        setResult(null);
                        setAiAdvice(null);
                        setConsecutiveHigh(0);
                        setLevelUpHint(false);
                        setRecentAttempts([]);
                      }}
                      style={{ marginTop:'0.6rem' }}
                    >
                      Jump to Level {Math.min(selectedLevel + 1, 3)} ⭐
                    </AnimatedButton>
                  )}
                </div>
              )}

              {/* AI Adaptive advice (shown when struggling) */}
              {aiAdvice && (
                <div style={{
                  width:'100%', padding:'1.2rem 1.5rem',
                  background:'linear-gradient(135deg, rgba(177,127,255,0.12), rgba(77,170,255,0.12))',
                  borderRadius:'var(--radius-md)', border:'1.5px solid rgba(177,127,255,0.3)',
                }}>
                  <p style={{ fontWeight:700, color:'var(--color-primary)', marginBottom:'0.4rem', fontSize:'0.9rem' }}>
                    🤖 AI Coach says:
                  </p>
                  <p style={{ color:'var(--text-main)', fontSize:'0.95rem', lineHeight:1.5 }}>
                    {aiAdvice.explanation}
                  </p>
                  {aiAdvice.easierAlternative && (
                    <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.5rem', fontStyle:'italic' }}>
                      💡 Try: "{aiAdvice.easierAlternative}"
                    </p>
                  )}
                </div>
              )}

              <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
                <AnimatedButton variant="outline" onClick={() => { setResult(null); setAiAdvice(null); setLevelUpHint(false); }}>🔄 Retry</AnimatedButton>
                <AnimatedButton variant="success" onClick={handleNext}>
                  {isLast ? '🎉 Finish Level' : 'Next Prompt ➡️'}
                </AnimatedButton>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}