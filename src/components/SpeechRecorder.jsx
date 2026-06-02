import React, { useState, useEffect, useRef, useCallback } from 'react';
import { evaluateSpeechWithDeepSeek } from '../services/deepseekService';
import { evaluateSpeech } from '../services/adaptiveLearning';

// ─── States ───────────────────────────────────────────────────────────────────
// 'idle'       → waiting for user to press mic
// 'recording'  → mic active, timer running, STT listening
// 'processing' → recording stopped, awaiting evaluation
// 'done'       → result passed upward, showing "ready again" hint

export default function SpeechRecorder({ expectedText, onResult, startTime: externalStartTime }) {
  const [phase, setPhase]           = useState('idle');      // idle | recording | processing | done
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported]   = useState(true);
  const [elapsed, setElapsed]       = useState(0);           // seconds counter while recording
  const [statusMsg, setStatusMsg]   = useState('');

  const recognitionRef  = useRef(null);
  const transcriptRef   = useRef('');
  const timerRef        = useRef(null);
  const recordStartRef  = useRef(null);  // performance.now() when recording began

  // ── Formatted MM:SS ─────────────────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Boot SpeechRecognition once ──────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      console.warn('[SpeechRecorder] Web Speech API not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      transcriptRef.current = full;
      setTranscript(full);
    };

    rec.onerror = (e) => {
      console.error('[SpeechRecorder] Speech recognition error:', e.error);
      stopTimer();
      if (e.error === 'not-allowed') {
        setStatusMsg('⚠️ Microphone permission denied. Please allow microphone access.');
      } else {
        setStatusMsg(`⚠️ Recognition error: ${e.error}. Please try again.`);
      }
      setPhase('idle');
    };

    rec.onend = () => {
      // Only trigger evaluation if we were actively recording (avoid spurious fires)
      if (phase === 'recording' || phaseRef.current === 'recording') {
        handleStopInternal();
      }
    };

    recognitionRef.current = rec;

    return () => {
      stopTimer();
      try { rec.stop(); } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a ref to phase so the rec.onend closure can read it reliably
  const phaseRef = useRef('idle');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Timer helpers ────────────────────────────────────────────────────────────
  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // ── Start recording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported. Please use Chrome or Edge.');
      return;
    }
    console.log('[SpeechRecorder] Recording started 🎙️');
    transcriptRef.current = '';
    setTranscript('');
    setStatusMsg('');
    recordStartRef.current = performance.now();

    try {
      recognitionRef.current.start();
      setPhase('recording');
      startTimer();
    } catch (e) {
      // Already started – stop first then restart
      console.warn('[SpeechRecorder] Recognition already active, restarting…', e);
      recognitionRef.current.stop();
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          setPhase('recording');
          startTimer();
        } catch (err) {
          console.error('[SpeechRecorder] Restart failed:', err);
        }
      }, 300);
    }
  }, []);

  // ── Stop + evaluate (internal, called by button OR rec.onend) ───────────────
  const handleStopInternal = useCallback(async () => {
    // Guard: only run once
    if (phaseRef.current !== 'recording') return;

    stopTimer();
    const spoken = transcriptRef.current.trim();
    const endTime = performance.now();
    const startMs = recordStartRef.current ?? endTime;

    console.log('[SpeechRecorder] Recording stopped ⏹️, transcript:', `"${spoken}"`);

    setPhase('processing');
    setStatusMsg('⏳ Processing your answer…');

    if (!spoken) {
      console.warn('[SpeechRecorder] No speech detected.');
      setStatusMsg('😕 No speech detected. Please try again.');
      setPhase('idle');
      return;
    }

    console.log('[SpeechRecorder] Audio captured ✅ — sending for evaluation…');

    // Rule-based baseline metrics
    const evaluated = evaluateSpeech(
      expectedText,
      spoken,
      externalStartTime ?? startMs,
      endTime
    );

    // DeepSeek qualitative evaluation
    let deepseekResult;
    try {
      deepseekResult = await evaluateSpeechWithDeepSeek(expectedText, spoken, evaluated.metrics);
      console.log('[SpeechRecorder] Evaluation complete ✓', deepseekResult);
    } catch (err) {
      console.warn('[SpeechRecorder] DeepSeek call failed, using rule-based feedback:', err);
      deepseekResult = {
        feedbackMessage: evaluated.performanceScore >= 70
          ? '🎉 Great job! Keep going!'
          : '💪 Nice try! Let\'s practise more!',
        easierAlternative: null,
        clarity: evaluated.metrics.accuracy,
      };
    }

    setStatusMsg('');
    setPhase('done');

    onResult({
      transcript: spoken,
      evaluated,
      score:           evaluated.performanceScore,
      deepseekFeedback: deepseekResult.feedbackMessage,
      easierAlternative: deepseekResult.easierAlternative,
      clarity:          deepseekResult.clarity,
    });
  }, [expectedText, externalStartTime, onResult]);

  // ── Button click handler ─────────────────────────────────────────────────────
  const handleButtonClick = () => {
    if (phase === 'idle' || phase === 'done') {
      // Reset for new attempt
      setPhase('idle');
      setTranscript('');
      setStatusMsg('');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setTimeout(() => startRecording(), 150);
    } else if (phase === 'recording') {
      // Stop recognition; rec.onend will call handleStopInternal
      recognitionRef.current.stop();
    }
    // If processing, ignore button
  };

  // ── Waveform bars ────────────────────────────────────────────────────────────
  const bars = Array.from({ length: 10 });

  // ── Derived UI ───────────────────────────────────────────────────────────────
  const isRecording   = phase === 'recording';
  const isProcessing  = phase === 'processing';
  const isDone        = phase === 'done';

  const buttonBg = isRecording
    ? 'linear-gradient(135deg, #FF7B7B, #FF4444)'
    : isProcessing
    ? 'linear-gradient(135deg, #FFD15E, #FF9A5E)'
    : 'linear-gradient(135deg, #4DAAFF, #7B6FFF)';

  const buttonLabel = isRecording
    ? '⏹️'
    : isProcessing
    ? '⏳'
    : '🎤';

  const statusText = isRecording
    ? `● Recording… ${formatTime(elapsed)}`
    : isProcessing
    ? '⏳ Processing your answer…'
    : isDone
    ? '✅ Done! Tap 🎤 to retry'
    : 'Tap microphone to speak';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', width: '100%' }}>

      {/* Animated waveform (visible while recording) */}
      {isRecording && (
        <div className="waveform animate-fade-in">
          {bars.map((_, i) => (
            <div key={i} className="waveform-bar" style={{
              background: 'linear-gradient(to top, #4DAAFF, #B07FFF)',
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      )}

      {/* Mic / stop button with pulse rings */}
      <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isRecording && (
          <>
            <div className="mic-pulse-ring" />
            <div className="mic-pulse-ring" style={{ animationDelay: '0.4s' }} />
            <div className="mic-pulse-ring" style={{ animationDelay: '0.8s' }} />
          </>
        )}
        <button
          onClick={handleButtonClick}
          disabled={isProcessing}
          style={{
            width: '110px', height: '110px',
            borderRadius: '50%',
            background: buttonBg,
            border: 'none',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem',
            boxShadow: isRecording
              ? '0 0 30px rgba(255,80,80,0.5)'
              : '0 10px 30px rgba(77,170,255,0.4)',
            transition: 'all 0.3s ease',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
            position: 'relative', zIndex: 1,
            opacity: isProcessing ? 0.7 : 1,
          }}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {buttonLabel}
        </button>
      </div>

      {/* Timer badge (recording only) */}
      {isRecording && (
        <div className="animate-fade-in" style={{
          padding: '0.3rem 1rem',
          background: 'rgba(255,80,80,0.12)',
          border: '1.5px solid rgba(255,80,80,0.4)',
          borderRadius: '999px',
          fontWeight: 800,
          fontSize: '1.1rem',
          color: '#FF4444',
          letterSpacing: '2px',
          fontFamily: 'monospace',
        }}>
          {formatTime(elapsed)}
        </div>
      )}

      {/* Status text */}
      <p style={{
        fontWeight: 700,
        color: isRecording ? 'var(--color-danger)'
          : isProcessing ? '#FF9A5E'
          : 'var(--text-muted)',
        fontSize: '1.1rem',
        animation: isRecording ? 'pulse 2s infinite' : 'none',
        textAlign: 'center',
      }}>
        {statusText}
      </p>

      {/* Extra status message (errors / no-speech) */}
      {statusMsg && !isProcessing && (
        <p style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
          {statusMsg}
        </p>
      )}

      {/* Browser support warning */}
      {!supported && (
        <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
          ⚠️ Speech recognition not supported. Please use Chrome or Edge.
        </p>
      )}

      {/* Live transcript preview */}
      {transcript && (
        <div className="animate-fade-in" style={{
          padding: '1rem 1.5rem',
          background: 'rgba(77,170,255,0.08)',
          border: '1.5px solid rgba(77,170,255,0.25)',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
            {isRecording ? '🎙️ Listening…' : 'You said:'}
          </p>
          <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--text-main)' }}>
            "{transcript}"
          </p>
        </div>
      )}
    </div>
  );
}