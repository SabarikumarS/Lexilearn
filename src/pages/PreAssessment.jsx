/**
 * PreAssessment.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Mandatory 5-section pre-assessment for LexiLearn.
 * Sections: Alphabet → Phonics → Vocabulary → Sentence → Comprehension
 * Each section has 3 questions (Easy / Medium / Hard).
 * At the end: classifies skill level, detects dyslexia patterns, and
 * saves results to Supabase (logged-in) or localStorage (guest).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  buildAssessmentQuestions,
  scoreQuestion,
  calculateScores,
  classifySkillLevel,
  detectWeakAreas,
  detectStrengths,
  detectDyslexiaRisk,
  generateLearningPath,
  saveAssessmentResults,
  saveUserProfile,
  saveUserProfileLocally,
  SECTION_LABELS,
  SKILL_LEVEL_CONFIG,
  SECTION_SCORE_LABEL,
} from '../services/assessmentService';

// ─────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────

const TOTAL_SECTIONS = 5;
const QUESTIONS_PER_SECTION = 3;
const TOTAL_QUESTIONS = TOTAL_SECTIONS * QUESTIONS_PER_SECTION;

// ─────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────

function ProgressBar({ current, total, sectionIdx, sectionName }) {
  const percent = Math.round((current / total) * 100);
  const sectionPercent = Math.round(((sectionIdx) / TOTAL_SECTIONS) * 100);

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Section breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['🔤', '🔊', '📝', '📖', '🧠'].map((icon, i) => (
          <div
            key={i}
            style={{
              width: '38px', height: '38px',
              borderRadius: '50%',
              background: i < sectionIdx
                ? 'linear-gradient(135deg, #5DD87A, #3ECFA8)'
                : i === sectionIdx
                  ? 'linear-gradient(135deg, #4DAAFF, #B07FFF)'
                  : 'rgba(0,0,0,0.08)',
              border: i === sectionIdx ? '2px solid #4DAAFF' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              transform: i === sectionIdx ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.3s ease',
              boxShadow: i === sectionIdx ? '0 4px 14px rgba(77,170,255,0.4)' : 'none',
            }}
          >
            {i < sectionIdx ? '✓' : icon}
          </div>
        ))}
      </div>

      {/* Current section label */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <span style={{
          background: 'linear-gradient(135deg, rgba(77,170,255,0.15), rgba(176,127,255,0.15))',
          border: '1.5px solid rgba(77,170,255,0.25)',
          borderRadius: '999px',
          padding: '0.35rem 1.2rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-main)',
        }}>
          {sectionName}
        </span>
      </div>

      {/* Overall progress bar */}
      <div style={{
        background: 'rgba(0,0,0,0.08)',
        borderRadius: '999px',
        height: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #4DAAFF, #B07FFF)',
          borderRadius: '999px',
          transition: 'width 0.5s cubic-bezier(0.34,1.2,0.64,1)',
        }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
        Question {current} of {total}
      </div>
    </div>
  );
}

function QuestionTimer({ onTimeUp, active }) {
  const [seconds, setSeconds] = useState(30);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep ref updated so the interval always calls the latest callback
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  useEffect(() => {
    if (!active) { setSeconds(30); return; }
    setSeconds(30);
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Defer outside the render cycle to avoid the React warning
          setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);


  const color = seconds > 15 ? '#5DD87A' : seconds > 8 ? '#FFD15E' : '#FF7B7B';
  const pct = (seconds / 30) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '1rem' }}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 15}`}
          strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
        <text x="18" y="23" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
          {seconds}
        </text>
      </svg>
    </div>
  );
}

function OptionButton({ option, selected, correct, showResult, onClick, disabled }) {
  let bg = 'var(--card-bg)';
  let border = '2px solid rgba(0,0,0,0.1)';
  let color = 'var(--text-main)';
  let transform = 'scale(1)';

  if (selected && showResult) {
    if (correct) {
      bg = 'rgba(93,216,122,0.18)'; border = '2px solid #5DD87A'; color = '#2a7a3e';
    } else {
      bg = 'rgba(255,123,123,0.18)'; border = '2px solid #FF7B7B'; color = '#a83232';
    }
  } else if (selected && !showResult) {
    bg = 'rgba(77,170,255,0.15)'; border = '2px solid #4DAAFF';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '1rem 1.5rem',
        background: bg,
        border,
        borderRadius: 'var(--radius-lg)',
        color,
        fontSize: '1rem',
        fontWeight: 600,
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        transform,
        boxShadow: selected && !showResult ? '0 4px 16px rgba(77,170,255,0.2)' : 'none',
        fontFamily: 'var(--font-primary)',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {selected && showResult && (correct ? '✅ ' : '❌ ')}
      {option}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ─────────────────────────────────────────────────────────────────────

function ResultsScreen({ results, onStart }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { sectionScores, overallScore, skillLevel, weakAreas, strengths, dyslexiaRisk, learningPath, errorPatterns } = results;
  const cfg = SKILL_LEVEL_CONFIG[skillLevel] || SKILL_LEVEL_CONFIG.beginner;

  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.6s cubic-bezier(0.34,1.2,0.64,1)',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}60)`,
          border: `3px solid ${cfg.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', margin: '0 auto 1.2rem',
          boxShadow: `0 12px 40px ${cfg.color}40`,
          animation: 'popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          {cfg.emoji}
        </div>
        <h2 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontFamily: 'var(--font-secondary)', fontWeight: 900,
          marginBottom: '0.5rem',
          background: `linear-gradient(135deg, ${cfg.color}, #B07FFF)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {cfg.label}!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          {cfg.description}
        </p>
        <div style={{
          display: 'inline-block',
          background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}10)`,
          border: `1.5px solid ${cfg.color}40`,
          borderRadius: '999px', padding: '0.4rem 1.5rem',
          fontWeight: 800, fontSize: '1.5rem', color: cfg.color,
        }}>
          {overallScore}% Overall
        </div>
      </div>

      {/* Section Scores */}
      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.2rem' }}>
          📊 Section Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {Object.entries(sectionScores).map(([section, score]) => {
            const { label, color } = SECTION_SCORE_LABEL(score);
            return (
              <div key={section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {SECTION_LABELS[section] || section}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{score}% · {label}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '999px', height: '8px' }}>
                  <div style={{
                    width: `${score}%`, height: '100%', borderRadius: '999px',
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                    transition: 'width 1s cubic-bezier(0.34,1.2,0.64,1)',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Areas & Strengths */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {weakAreas.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.3rem', borderTop: '3px solid #FF7B7B' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.8rem' }}>
              🎯 Focus Areas
            </h4>
            {weakAreas.map(area => (
              <div key={area} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.85rem', fontWeight: 600, color: '#FF7B7B', marginBottom: '0.4rem',
              }}>
                ⚠️ {SECTION_LABELS[area]?.replace(/[🔤🔊📝📖🧠]\s/, '') || area}
              </div>
            ))}
          </div>
        )}
        {strengths.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.3rem', borderTop: '3px solid #5DD87A' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.8rem' }}>
              💪 Your Strengths
            </h4>
            {strengths.map(area => (
              <div key={area} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.85rem', fontWeight: 600, color: '#5DD87A', marginBottom: '0.4rem',
              }}>
                ✅ {SECTION_LABELS[area]?.replace(/[🔤🔊📝📖🧠]\s/, '') || area}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dyslexia Risk */}
      {dyslexiaRisk && (
        <div className="glass-panel" style={{
          padding: '1.3rem', marginBottom: '1.5rem',
          background: 'rgba(176,127,255,0.08)',
          border: '1.5px solid rgba(176,127,255,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🧠</span>
            <div>
              <div style={{ fontWeight: 800, color: '#B07FFF', fontSize: '0.95rem', marginBottom: '2px' }}>
                Dyslexia Pattern Detected
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Some letter confusions were noticed (e.g. b/d, p/q). Your learning path includes targeted exercises!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Path Preview */}
      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          🗺️ Your Personalized Learning Path
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {learningPath.slice(0, 4).map((item, i) => {
            const pColor = item.priority === 'high' ? '#FF7B7B' : item.priority === 'medium' ? '#FFD15E' : '#5DD87A';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '0.75rem 1rem',
                background: `${pColor}10`,
                border: `1.5px solid ${pColor}30`,
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${pColor}50, ${pColor}20)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: pColor, fontWeight: 600, textTransform: 'capitalize' }}>
                    {item.priority} priority · {item.score}% score
                  </div>
                </div>
                <div style={{
                  background: pColor, color: 'white', borderRadius: '999px',
                  padding: '2px 10px', fontSize: '0.72rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {i === 0 ? 'Start' : `Step ${i + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onStart}
          style={{
            padding: '1rem 3rem', fontSize: '1.15rem', fontWeight: 800,
            background: `linear-gradient(135deg, ${cfg.color}, #B07FFF)`,
            color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            boxShadow: `0 8px 28px ${cfg.color}50`,
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-primary)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 14px 36px ${cfg.color}60`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          🚀 Start My Learning Journey!
        </button>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
          Your personalized path is ready!
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// INTRO SCREEN
// ─────────────────────────────────────────────────────────────────────

function IntroScreen({ onBegin }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem', margin: '0 auto 1.5rem',
        boxShadow: '0 12px 40px rgba(77,170,255,0.4)',
        animation: 'popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        🎯
      </div>

      <h1 style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
        fontFamily: 'var(--font-secondary)', fontWeight: 900,
        marginBottom: '0.75rem',
        background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Quick Skills Check!
      </h1>

      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 2rem' }}>
        Before we start, let's do a <strong style={{ color: 'var(--text-main)' }}>quick 15-question check</strong> to build your perfect learning plan. It only takes ~5 minutes!
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '2.5rem', textAlign: 'left',
      }}>
        {[
          { icon: '🔤', title: 'Alphabet', desc: '3 questions' },
          { icon: '🔊', title: 'Phonics', desc: '3 questions' },
          { icon: '📝', title: 'Vocabulary', desc: '3 questions' },
          { icon: '📖', title: 'Sentences', desc: '3 questions' },
          { icon: '🧠', title: 'Comprehension', desc: '3 questions' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '0.9rem 1.1rem',
            background: 'rgba(77,170,255,0.07)',
            border: '1.5px solid rgba(77,170,255,0.2)',
            borderRadius: 'var(--radius-md)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
        <button
          onClick={onBegin}
          style={{
            padding: '1rem 3.5rem', fontSize: '1.15rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(77,170,255,0.45)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-primary)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(77,170,255,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Let's Go! 🚀
        </button>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          No pressure — just answer your best!
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────

export default function PreAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Assessment state
  const [phase, setPhase] = useState('intro'); // 'intro' | 'quiz' | 'results'
  const [sections, setSections] = useState([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  // Use BOTH a ref (sync, always fresh) and state (triggers re-render)
  const answerLogRef = useRef([]);
  const [answerLog, setAnswerLog] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [results, setResults] = useState(null);
  const [saving, setSaving] = useState(false);

  // Slide animation
  const [slideIn, setSlideIn] = useState(true);
  const questionStartTime = useRef(Date.now());
  const showResultRef = useRef(false);
  const currentQuestionRef = useRef(null);
  const currentSectionRef  = useRef(null);

  const currentSection  = sections[currentSectionIdx];
  const currentQuestion = currentSection?.questions[currentQuestionIdx];
  const globalQuestionIdx = currentSectionIdx * QUESTIONS_PER_SECTION + currentQuestionIdx;

  // Keep refs in sync with current values
  useEffect(() => { showResultRef.current = showResult; }, [showResult]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { currentSectionRef.current  = currentSection;  }, [currentSection]);

  // ── Start assessment ─────────────────────────────────────────────
  function beginAssessment() {
    const built = buildAssessmentQuestions();
    answerLogRef.current = [];
    setSections(built);
    setCurrentSectionIdx(0);
    setCurrentQuestionIdx(0);
    setAnswerLog([]);
    setPhase('quiz');
    setSlideIn(true);
    setTimerActive(true);
    questionStartTime.current = Date.now();
  }

  // ── Handle answer ────────────────────────────────────────────────
  function handleAnswer(option) {
    if (showResultRef.current) return;
    const q = currentQuestionRef.current;
    const s = currentSectionRef.current;
    if (!q || !s) return;

    const timeTakenMs = Date.now() - questionStartTime.current;
    setSelectedOption(option);
    setTimerActive(false);
    showResultRef.current = true;
    setShowResult(true);

    const { correct, points, confusedPairs } = scoreQuestion(q, option, timeTakenMs);

    const logEntry = {
      section:     s.section,
      questionId:  q.id,
      difficulty:  q.difficulty,
      correct,
      points,
      confusedPairs,
      timeTakenMs,
      chosen:      option,
      answer:      q.answer,
    };

    // Update ref SYNCHRONOUSLY so handleNext sees it
    answerLogRef.current = [...answerLogRef.current, logEntry];
    setAnswerLog(answerLogRef.current);
  }

  // ── Handle time-up ───────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (!showResultRef.current && currentQuestionRef.current) {
      handleAnswer(null); // treated as wrong
    }
  }, []);

  // ── Advance to next question/section ────────────────────────────
  function handleNext() {
    setSlideIn(false);
    setTimeout(() => {
      showResultRef.current = false;
      setShowResult(false);
      setSelectedOption(null);

      const nextQ = currentQuestionIdx + 1;
      if (nextQ < QUESTIONS_PER_SECTION) {
        setCurrentQuestionIdx(nextQ);
      } else {
        const nextS = currentSectionIdx + 1;
        if (nextS < TOTAL_SECTIONS) {
          setCurrentSectionIdx(nextS);
          setCurrentQuestionIdx(0);
        } else {
          // All done — use ref for guaranteed fresh data
          finishAssessment(answerLogRef.current);
          return;
        }
      }

      setSlideIn(true);
      setTimerActive(true);
      questionStartTime.current = Date.now();
    }, 250);
  }

  // Due to handleAnswer using answerLog before setState completes,
  // we need to compute finish with the final answerLog
  function finishAssessment(log) {
    const { sectionScores, overallScore, errorPatterns, totalTimeSec } = calculateScores(log);
    const skillLevel   = classifySkillLevel(overallScore);
    const weakAreas    = detectWeakAreas(sectionScores);
    const strengths    = detectStrengths(sectionScores);
    const dyslexiaRisk = detectDyslexiaRisk(log, errorPatterns);
    const learningPath = generateLearningPath(sectionScores, skillLevel);

    const finalResults = {
      sectionScores,
      overallScore,
      skillLevel,
      weakAreas,
      strengths,
      dyslexiaRisk,
      learningPath,
      errorPatterns,
      totalTimeSec,
      answerLog: log,
    };

    setResults(finalResults);
    setPhase('results');
    persistResults(finalResults);
  }

  // ── Persist after quiz ends ──────────────────────────────────────
  async function persistResults(r) {
    setSaving(true);
    const profile = {
      skillLevel:    r.skillLevel,
      strengths:     r.strengths,
      weakAreas:     r.weakAreas,
      errorPatterns: r.errorPatterns,
      learningPath:  r.learningPath,
      xp:            r.answerLog.reduce((s, a) => s + (a.points || 0), 0),
      badges:        [],
    };

    // Always save locally
    saveUserProfileLocally(profile);

    // Save to Supabase if logged in
    if (user?.id) {
      await saveAssessmentResults(user.id, r);
      await saveUserProfile(user.id, profile);
    }
    setSaving(false);
  }

  // ── Navigate to dashboard after results ─────────────────────────
  function handleStartLearning() {
    navigate('/');
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1a 100%)'
        : 'radial-gradient(ellipse at top, #f0f7ff 0%, #fafbff 100%)',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-blue"   style={{ width: '400px', height: '400px', top: '-150px', left: '-150px' }} />
      <div className="bg-orb bg-orb-purple" style={{ width: '350px', height: '350px', bottom: '-100px', right: '-100px' }} />

      <div style={{
        maxWidth: '680px', margin: '0 auto',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', boxShadow: '0 4px 14px rgba(77,170,255,0.4)',
            }}>
              📚
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-secondary)', color: 'var(--text-main)' }}>
              LexiLearn
            </span>
          </div>

          {phase === 'quiz' && (
            <div style={{
              background: 'rgba(77,170,255,0.1)', border: '1.5px solid rgba(77,170,255,0.25)',
              borderRadius: '999px', padding: '0.3rem 1rem',
              fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)',
            }}>
              Pre-Assessment
            </div>
          )}
        </div>

        {/* ── INTRO ── */}
        {phase === 'intro' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem 2.5rem' }}>
            <IntroScreen onBegin={beginAssessment} />
          </div>
        )}

        {/* ── QUIZ ── */}
        {phase === 'quiz' && currentQuestion && (
          <div className="glass-panel" style={{ padding: '2.5rem' }}>

            <ProgressBar
              current={globalQuestionIdx + 1}
              total={TOTAL_QUESTIONS}
              sectionIdx={currentSectionIdx}
              sectionName={SECTION_LABELS[currentSection?.section]}
            />

            <QuestionTimer
              active={timerActive && !showResult}
              onTimeUp={handleTimeUp}
              key={`${currentSectionIdx}-${currentQuestionIdx}`}
            />

            {/* Passage (for comprehension) */}
            {currentQuestion.passage && (
              <div style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(77,170,255,0.05)',
                border: '1.5px solid rgba(77,170,255,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem 1.5rem',
                marginBottom: '1.5rem',
                lineHeight: 1.8,
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                fontStyle: 'italic',
              }}>
                📖 {currentQuestion.passage}
              </div>
            )}

            {/* Question */}
            <div
              style={{
                opacity: slideIn ? 1 : 0,
                transform: slideIn ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.25s ease',
              }}
            >
              <h2 style={{
                fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                fontWeight: 800, color: 'var(--text-main)',
                marginBottom: '1.5rem', lineHeight: 1.5,
              }}>
                <span style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, rgba(77,170,255,0.15), rgba(176,127,255,0.15))',
                  borderRadius: '8px', padding: '2px 10px',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)',
                  marginRight: '8px', verticalAlign: 'middle',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.prompt}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {currentQuestion.options.map(option => (
                  <OptionButton
                    key={option}
                    option={option}
                    selected={selectedOption === option}
                    correct={option === currentQuestion.answer}
                    showResult={showResult}
                    disabled={showResult}
                    onClick={() => handleAnswer(option)}
                  />
                ))}
              </div>

              {/* Feedback + Next */}
              {showResult && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}>
                  <div style={{
                    padding: '0.75rem 1.5rem',
                    background: selectedOption === currentQuestion.answer
                      ? 'rgba(93,216,122,0.12)' : 'rgba(255,123,123,0.12)',
                    border: `1.5px solid ${selectedOption === currentQuestion.answer ? '#5DD87A' : '#FF7B7B'}`,
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700, fontSize: '0.95rem',
                    color: selectedOption === currentQuestion.answer ? '#2a7a3e' : '#a83232',
                    textAlign: 'center',
                  }}>
                    {selectedOption === currentQuestion.answer
                      ? '🎉 Correct! Well done!'
                      : selectedOption === null
                        ? `⏰ Time's up! The answer was: ${currentQuestion.answer}`
                        : `The correct answer is: ${currentQuestion.answer}`
                    }
                  </div>

                  <button
                    onClick={handleNext}
                    style={{
                      padding: '0.8rem 2.5rem',
                      background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
                      color: 'white', border: 'none',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '1rem', fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(77,170,255,0.4)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    {globalQuestionIdx + 1 >= TOTAL_QUESTIONS ? 'See My Results 🎯' : 'Next Question →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && results && (
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            {saving ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
                <p style={{ color: 'var(--text-muted)' }}>Saving your results…</p>
              </div>
            ) : (
              <ResultsScreen results={results} onStart={handleStartLearning} />
            )}
          </div>
        )}

        {/* Guest notice */}
        {!user && phase !== 'results' && (
          <div style={{
            marginTop: '1.5rem', textAlign: 'center',
            fontSize: '0.82rem', color: 'var(--text-muted)',
          }}>
            💡 Playing as guest — <button
              onClick={() => navigate('/login')}
              style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
            >
              Sign in
            </button> to save your progress permanently.
          </div>
        )}
      </div>
    </div>
  );
}
