import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedButton from '../components/AnimatedButton';
import CelebrationModal from '../components/CelebrationModal';
import { logGameCompletion } from '../services/progressService';

// ============================================================
// GAME REGISTRY
// ============================================================
const GAMES = [
  { id:'match',    title:'Word Match',       icon:'🧩', difficulty:'Easy',   color:'#4DAAFF', bg:'#EEF6FF',  desc:'Match words to their pictures!' },
  { id:'phonics',  title:'Phonics Fun',      icon:'🔊', difficulty:'Medium', color:'#B07FFF', bg:'#F4EEFF',  desc:'Hear the sound and find the letter!' },
  { id:'vocab',    title:'Word Scramble',    icon:'📝', difficulty:'Medium', color:'#FFD15E', bg:'#FFFBED',  desc:'Unscramble the letters to make a word!' },
  { id:'letters',  title:'Letter Catch',     icon:'🅰️', difficulty:'Easy',   color:'#5DD87A', bg:'#EDFFF5',  desc:'Click the correct falling letters!' },
  { id:'missing',  title:'Missing Letter',   icon:'🔤', difficulty:'Medium', color:'#FF9A5E', bg:'#FFF2E8',  desc:'Fill in the missing letter!' },
  { id:'sentence', title:'Sentence Builder', icon:'📃', difficulty:'Hard',   color:'#3ECFA8', bg:'#EDFFF5',  desc:'Put the words in the right order!' },
];

// ============================================================
// WORD MATCH GAME
// ============================================================
const MATCH_ROUNDS = [
  { words: ['cat','dog','sun'], images: [{ id:'cat', e:'🐱' },{ id:'dog', e:'🐶' },{ id:'sun', e:'🌞' }] },
  { words: ['fish','bird','hat'], images: [{ id:'fish', e:'🐟' },{ id:'bird', e:'🐦' },{ id:'hat', e:'🎩' }] },
  { words: ['ball','tree','cake'], images: [{ id:'ball', e:'⚽️' },{ id:'tree', e:'🌳' },{ id:'cake', e:'🎂' }] },
];

function WordMatch({ onWin, isDark }) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [points, setPoints] = useState(0);

  const data = MATCH_ROUNDS[round];

  const handleWord = (w) => { if (!matched.includes(w)) setSelected(w); };
  const handleImage = (imgId) => {
    if (matched.includes(imgId)) return;
    if (selected === imgId) {
      const newMatched = [...matched, imgId];
      setMatched(newMatched);
      setPoints(p => p + 10);
      setSelected(null);
      if (newMatched.length === data.words.length) {
        setTimeout(() => {
          if (round < MATCH_ROUNDS.length - 1) { setRound(r => r+1); setMatched([]); }
          else onWin(points + 10);
        }, 800);
      }
    } else setSelected(null);
  };

  const shuffled = [...data.images].sort(() => Math.random() > 0.5 ? 1 : -1);
  const unselBorder = isDark ? 'rgba(255,255,255,0.18)' : '#E2E8F0';

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#4DAAFF' }}>Word Match 🧩</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'0.5rem' }}>Round {round+1} of {MATCH_ROUNDS.length} · ⭐ {points} pts</p>
      <p style={{ marginBottom:'2rem', fontWeight:600, color:'var(--text-main)' }}>Click a word, then click its matching picture!</p>

      <div style={{ display:'flex', justifyContent:'center', gap:'4rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {data.words.map(w => (
            <button key={w} onClick={() => handleWord(w)} style={{
              padding:'0.9rem 2rem', fontSize:'1.4rem', borderRadius:'var(--radius-md)',
              border:`3px solid ${selected===w ? 'var(--color-primary)' : matched.includes(w) ? 'transparent' : unselBorder}`,
              background: matched.includes(w) ? 'linear-gradient(135deg,#5DD87A,#3ECFA8)' : selected===w ? (isDark ? 'rgba(77,170,255,0.2)' : '#EEF6FF') : 'var(--color-card-bg)',
              color: matched.includes(w) ? 'white' : 'var(--text-main)',
              fontWeight:700, cursor: matched.includes(w) ? 'default' : 'pointer',
              boxShadow: selected===w ? 'var(--shadow-glow-blue)' : 'var(--shadow-sm)', transition:'all 0.2s'
            }}>{w.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {shuffled.map(img => (
            <button key={img.id} onClick={() => handleImage(img.id)} style={{
              padding:'0.9rem 2rem', fontSize:'2.5rem', borderRadius:'var(--radius-md)',
              border:`3px solid ${matched.includes(img.id) ? 'transparent' : unselBorder}`,
              background: matched.includes(img.id) ? 'linear-gradient(135deg,#5DD87A,#3ECFA8)' : 'var(--color-card-bg)',
              cursor: matched.includes(img.id) ? 'default' : 'pointer',
              boxShadow:'var(--shadow-sm)', transition:'all 0.2s', lineHeight:1
            }}>{img.e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PHONICS GAME
// ============================================================
const PHONICS_ROUNDS = [
  { letter:'B', options:['A','B','C','D'] },
  { letter:'S', options:['S','T','P','M'] },
  { letter:'R', options:['L','R','N','W'] },
  { letter:'M', options:['M','N','H','K'] },
  { letter:'T', options:['D','T','F','G'] },
];

function PhonicsGame({ onWin, isDark }) {
  const [idx, setIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);

  const round = PHONICS_ROUNDS[idx];
  const play = () => { const u = new SpeechSynthesisUtterance(round.letter); u.rate = 0.6; window.speechSynthesis.speak(u); };
  const handleSelect = (l) => {
    if (l === round.letter) {
      setPoints(p => p + 15); setMessage('✅ Correct!');
      setTimeout(() => { setMessage(''); if (idx < PHONICS_ROUNDS.length - 1) setIdx(i => i+1); else onWin(points + 15); }, 800);
    } else setMessage('❌ Try again!');
  };
  const unselBorder = isDark ? 'rgba(255,255,255,0.18)' : '#E2E8F0';

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#B07FFF' }}>Phonics Fun 🔊</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'0.5rem' }}>Round {idx+1} of {PHONICS_ROUNDS.length} · ⭐ {points} pts</p>
      <p style={{ marginBottom:'1.5rem', fontWeight:600, color:'var(--text-main)' }}>Listen to the sound and pick the correct letter!</p>
      <button onClick={play} style={{
        marginBottom:'2rem', fontSize:'1.4rem', padding:'1rem 2.5rem',
        background:'linear-gradient(135deg, #B07FFF, #7B6FFF)',
        color:'white', borderRadius:'var(--radius-full)',
        boxShadow:'0 6px 15px rgba(176,127,255,0.4)',
        border:'none', cursor:'pointer', fontWeight:700, transition:'transform 0.2s'
      }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
         onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        🔊 Listen
      </button>
      <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {round.options.map(o => (
          <button key={o} onClick={() => handleSelect(o)} style={{
            padding:'1.2rem 1.8rem', fontSize:'2rem', borderRadius:'var(--radius-md)',
            border:`3px solid ${unselBorder}`, background:'var(--color-card-bg)',
            fontWeight:800, cursor:'pointer', minWidth:'80px', color:'var(--text-main)',
            boxShadow:'var(--shadow-sm)', transition:'all 0.2s',
            fontFamily:'var(--font-secondary)'
          }}>{o}</button>
        ))}
      </div>
      {message && <h3 style={{ fontSize:'1.5rem', color: message.includes('✅') ? '#5DD87A' : '#FF7B7B' }}>{message}</h3>}
    </div>
  );
}

// ============================================================
// WORD SCRAMBLE GAME
// ============================================================
const SCRAMBLE_WORDS = [
  { word:'CAT', clue:'🐱 A furry pet' },
  { word:'SUN', clue:'☀️ It shines in the sky' },
  { word:'FISH', clue:'🐟 It swims in water' },
  { word:'TREE', clue:'🌳 It has leaves' },
  { word:'BIRD', clue:'🐦 It can fly' },
];

function shuffle(arr) {
  const a = [...arr]; for (let i=a.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a;
}

function VocabGame({ onWin, isDark }) {
  const [idx, setIdx] = useState(0);
  const [scrambled, setScrambled] = useState(() => shuffle(SCRAMBLE_WORDS[0].word.split('')));
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);

  const current = SCRAMBLE_WORDS[idx];

  const nextWord = useCallback(() => {
    const nextIdx = idx + 1;
    if (nextIdx < SCRAMBLE_WORDS.length) {
      setIdx(nextIdx);
      setScrambled(shuffle(SCRAMBLE_WORDS[nextIdx].word.split('')));
      setSelected([]);
      setMessage('');
    } else onWin(points + 20);
  }, [idx, points, onWin]);

  const handleLetter = (i) => {
    if (selected.includes(i)) return;
    const ns = [...selected, i];
    setSelected(ns);
    if (ns.length === current.word.length) {
      const spelled = ns.map(si => scrambled[si]).join('');
      if (spelled === current.word) {
        setPoints(p => p + 20); setMessage('✅ Correct! 🎉');
        setTimeout(nextWord, 900);
      } else { setMessage('❌ Try again!'); setTimeout(() => { setSelected([]); setMessage(''); }, 700); }
    }
  };

  const slotBg  = isDark ? 'rgba(255,209,94,0.12)' : '#FFFBED';
  const selTile = isDark ? 'rgba(255,209,94,0.28)' : '#FFE980';

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#FFD15E' }}>Word Scramble 📝</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'0.5rem' }}>Word {idx+1} of {SCRAMBLE_WORDS.length} · ⭐ {points} pts</p>
      <p style={{ fontWeight:700, fontSize:'1.2rem', marginBottom:'1.5rem', color:'var(--text-main)' }}>{current.clue}</p>

      {/* Answer slots */}
      <div style={{ display:'flex', justifyContent:'center', gap:'0.75rem', marginBottom:'2rem' }}>
        {current.word.split('').map((_,i) => (
          <div key={i} style={{
            width:'60px', height:'60px', borderRadius:'var(--radius-md)',
            border:'3px solid #FFD15E', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'2rem', fontWeight:800, fontFamily:'var(--font-secondary)',
            background: slotBg, color:'var(--text-main)',
          }}>{selected[i] !== undefined ? scrambled[selected[i]] : ''}</div>
        ))}
      </div>

      {/* Letter tiles */}
      <div style={{ display:'flex', justifyContent:'center', gap:'0.75rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {scrambled.map((l, i) => (
          <button key={i} onClick={() => handleLetter(i)} disabled={selected.includes(i)} style={{
            padding:'1rem 1.3rem', fontSize:'2rem', borderRadius:'var(--radius-md)',
            border:'3px solid #FFD15E', background: selected.includes(i) ? selTile : 'var(--color-card-bg)',
            fontWeight:800, cursor: selected.includes(i) ? 'default' : 'pointer',
            fontFamily:'var(--font-secondary)', transition:'all 0.15s',
            boxShadow:'var(--shadow-sm)', color:'var(--text-main)',
          }}>{l}</button>
        ))}
      </div>
      {message && <h3 style={{ fontSize:'1.5rem', color: message.includes('✅') ? '#5DD87A' : '#FF7B7B' }}>{message}</h3>}
    </div>
  );
}

// ============================================================
// LETTER CATCH GAME
// ============================================================
function LetterCatch({ onWin, isDark }) {
  const [target] = useState('A');
  const [letters, setLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const timeRef = useRef(null);

  useEffect(() => {
    timeRef.current = setInterval(() => {
      setLetters(prev => {
        const filtered = prev.filter(l => l.top < 92);
        const l = String.fromCharCode(65 + Math.floor(Math.random() * 8));
        const newLetter = { id: Date.now(), char: Math.random() > 0.45 ? target : l, left: 10 + Math.random() * 80, top: 0 };
        return [...filtered.map(l => ({ ...l, top: l.top + 12 })), newLetter];
      });
    }, 900);
    return () => clearInterval(timeRef.current);
  }, [target]);

  const handleClick = (char, id) => {
    setLetters(p => p.filter(l => l.id !== id));
    if (char === target) {
      const ns = score + 1;
      setScore(ns);
      setPoints(p => p + 12);
      if (ns >= 5) { clearInterval(timeRef.current); onWin(points + 12); }
    }
  };

  const arenaBg = isDark
    ? 'linear-gradient(to bottom, rgba(93,216,122,0.08), rgba(62,207,168,0.04))'
    : 'linear-gradient(to bottom, #EDFFF5, #C5F0CF)';
  const arenaBorder = isDark ? '2px solid rgba(93,216,122,0.25)' : '2px solid #5DD87A50';

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#5DD87A' }}>Letter Catch 🅰️</h2>
      <p style={{ fontWeight:700, marginBottom:'0.5rem', color:'var(--text-main)' }}>
        Catch the letter <span style={{ fontSize:'2rem', color:'#5DD87A', fontWeight:900 }}>{target}</span> · Score: {score}/5 · ⭐ {points}
      </p>
      <div style={{ position:'relative', height:'320px', borderRadius:'var(--radius-md)', overflow:'hidden', background:arenaBg, border:arenaBorder }}>
        {letters.map(l => (
          <button key={l.id} onClick={() => handleClick(l.char, l.id)} style={{
            position:'absolute', left:`${l.left}%`, top:`${l.top}%`,
            transform:'translateX(-50%)',
            width:'54px', height:'54px', borderRadius:'50%',
            background: l.char === target ? 'linear-gradient(135deg,#5DD87A,#3ECFA8)' : 'var(--color-card-bg)',
            color: l.char === target ? 'white' : 'var(--text-main)',
            fontSize:'1.6rem', fontWeight:900, fontFamily:'var(--font-secondary)',
            border: l.char === target ? 'none' : (isDark ? '2px solid rgba(255,255,255,0.15)' : '2px solid rgba(0,0,0,0.08)'),
            boxShadow: l.char === target ? 'var(--shadow-glow-green)' : 'var(--shadow-sm)',
            cursor:'pointer', transition:'top 0.9s linear'
          }}>{l.char}</button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MISSING LETTER GAME
// ============================================================
const MISSING_ROUNDS = [
  { word:'S_N',    answer:'U', hint:'☀️ Shines in the sky',     options:['A','E','U','O'] },
  { word:'C_T',    answer:'A', hint:'🐱 A furry animal',         options:['A','E','I','O'] },
  { word:'D_G',    answer:'O', hint:'🐶 Man\'s best friend',     options:['A','E','I','O'] },
  { word:'F_SH',   answer:'I', hint:'🐟 Lives underwater',       options:['A','E','I','O'] },
  { word:'TR__',   answer:'EE',hint:'🌳 Has leaves and a trunk', options:['EE','OO','AA','II'] },
  { word:'B_RD',   answer:'I', hint:'🐦 Can fly',               options:['A','E','I','U'] },
  { word:'ST_R',   answer:'A', hint:'⭐ Shines at night',        options:['A','E','I','O'] },
];

function MissingLetter({ onWin }) {
  const [idx, setIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const r = MISSING_ROUNDS[idx];

  const handleAnswer = (opt) => {
    if (opt === r.answer) {
      const np = points + 15; setPoints(np);
      setMessage('✅ Correct! Great job!');
      setTimeout(() => {
        setMessage('');
        if (idx < MISSING_ROUNDS.length - 1) setIdx(i => i+1);
        else onWin(np);
      }, 800);
    } else { setMessage(`❌ Try again! Hint: ${r.hint}`); setTimeout(() => setMessage(''), 900); }
  };

  const display = r.word.replace('_', ' _ ').replace('__', ' _ _ ');

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#FF9A5E' }}>Missing Letter 🔤</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'0.5rem' }}>Round {idx+1} of {MISSING_ROUNDS.length} · ⭐ {points} pts</p>
      <p style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'1.5rem' }}>{r.hint}</p>

      <div style={{
        fontSize:'3.5rem', fontWeight:900, letterSpacing:'10px',
        fontFamily:'var(--font-secondary)', marginBottom:'2rem',
        color:'#FF9A5E', textShadow:'0 4px 10px rgba(255,154,94,0.3)'
      }}>{display}</div>

      <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap' }}>
        {r.options.map(o => (
          <button key={o} onClick={() => handleAnswer(o)} style={{
            padding:'1.2rem 2rem', fontSize:'1.8rem', borderRadius:'var(--radius-md)',
            border:'3px solid #FF9A5E40', background:'var(--color-card-bg)',
            fontWeight:800, cursor:'pointer', minWidth:'80px',
            boxShadow:'var(--shadow-sm)', transition:'all 0.2s',
            fontFamily:'var(--font-secondary)'
          }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >{o}</button>
        ))}
      </div>
      {message && <h3 style={{ fontSize:'1.3rem', marginTop:'1.5rem', color: message.includes('✅') ? '#5DD87A' : '#FF7B7B' }}>{message}</h3>}
    </div>
  );
}

// ============================================================
// SENTENCE BUILDER GAME
// ============================================================
const SENTENCE_ROUNDS = [
  { words:['The','cat','sat','on','mat','the'], correct:'The cat sat on the mat' },
  { words:['I','a','like','apple','red'], correct:'I like a red apple' },
  { words:['dog','runs','The','fast'], correct:'The dog runs fast' },
  { words:['is','sun','The','bright'], correct:'The sun is bright' },
  { words:['played','park','We','the','in'], correct:'We played in the park' },
];

function SentenceBuilder({ onWin, isDark }) {
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const [bank, setBank] = useState(() => shuffle(SENTENCE_ROUNDS[0].words));

  const r = SENTENCE_ROUNDS[idx];
  const answerBg = isDark ? 'rgba(62,207,168,0.08)' : '#EDFFF5';

  const nextRound = useCallback(() => {
    const ni = idx + 1;
    if (ni < SENTENCE_ROUNDS.length) {
      setIdx(ni); setBank(shuffle(SENTENCE_ROUNDS[ni].words));
      setPlaced([]); setMessage('');
    } else onWin(points + 25);
  }, [idx, points, onWin]);

  const addWord = (word, bankIdx) => {
    const np = [...placed, word];
    setPlaced(np);
    const nb = bank.filter((_, i) => i !== bankIdx);
    setBank(nb);
    if (np.length === r.words.length) {
      const result = np.join(' ');
      if (result === r.correct) {
        const pts = points + 25; setPoints(pts);
        setMessage('✅ Perfect sentence! 🎉');
        setTimeout(nextRound, 900);
      } else {
        setMessage('❌ Not quite! Try again.');
        setTimeout(() => { setPlaced([]); setBank(shuffle(r.words)); setMessage(''); }, 1000);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ textAlign:'center' }}>
      <h2 style={{ fontSize:'2rem', marginBottom:'0.5rem', color:'#3ECFA8' }}>Sentence Builder 📃</h2>
      <p style={{ color:'var(--text-muted)', marginBottom:'0.5rem' }}>Sentence {idx+1} of {SENTENCE_ROUNDS.length} · ⭐ {points} pts</p>
      <p style={{ fontWeight:600, marginBottom:'1.5rem', color:'var(--text-main)' }}>Tap words to build a sentence!</p>

      {/* Answer area */}
      <div style={{
        minHeight:'64px', padding:'1rem 1.5rem',
        border:'2.5px dashed #3ECFA880', borderRadius:'var(--radius-md)',
        display:'flex', flexWrap:'wrap', gap:'0.75rem', justifyContent:'center', alignItems:'center',
        background: answerBg, marginBottom:'1.5rem'
      }}>
        {placed.length === 0
          ? <span style={{ color:'#3ECFA880', fontWeight:600 }}>Your sentence will appear here…</span>
          : placed.map((w,i) => (
            <span key={i} style={{
              background:'var(--color-card-bg)', border:'2px solid #3ECFA8', borderRadius:'var(--radius-md)',
              padding:'0.4rem 1rem', fontSize:'1.2rem', fontWeight:700, color:'var(--text-main)'
            }}>{w}</span>
          ))
        }
      </div>

      {/* Word bank */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', justifyContent:'center', marginBottom:'1.5rem' }}>
        {bank.map((w,i) => (
          <button key={i} onClick={() => addWord(w, i)} style={{
            padding:'0.7rem 1.4rem', fontSize:'1.2rem', borderRadius:'var(--radius-md)',
            border:'2px solid #3ECFA840', background:'var(--color-card-bg)',
            fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-sm)',
            transition:'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >{w}</button>
        ))}
      </div>

      {message && <h3 style={{ fontSize:'1.3rem', color: message.includes('✅') ? '#5DD87A' : '#FF7B7B' }}>{message}</h3>}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function LearningGames() {
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const [activeGame,  setActiveGame]  = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [celebPts,    setCelebPts]    = useState(0);

  const handleWin = (pts = 0) => {
    logGameCompletion(pts, 100, 2);
    setCelebPts(pts);
    setCelebration(true);
  };

  const handleCelebClose = () => {
    setCelebration(false);
    setActiveGame(null);
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'match':    return <WordMatch    onWin={handleWin} isDark={isDark} />;
      case 'phonics':  return <PhonicsGame  onWin={handleWin} isDark={isDark} />;
      case 'vocab':    return <VocabGame    onWin={handleWin} isDark={isDark} />;
      case 'letters':  return <LetterCatch  onWin={handleWin} isDark={isDark} />;
      case 'missing':  return <MissingLetter onWin={handleWin} isDark={isDark} />;
      case 'sentence': return <SentenceBuilder onWin={handleWin} isDark={isDark} />;
      default: return null;
    }
  };

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={signOut} />
      {celebration && <CelebrationModal onClose={handleCelebClose} score={celebPts} title="Game Complete! 🎉" subtitle="You did amazing!" />}

      <main style={{ flex:1, padding:'2rem', maxWidth:'1000px', margin:'0 auto', width:'100%', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:'2rem' }}>
          <AnimatedButton variant="ghost" size="sm" onClick={() => activeGame ? setActiveGame(null) : navigate('/')}>
            ⬅️ {activeGame ? 'Back to Games' : 'Home'}
          </AnimatedButton>
          <h1 style={{ flex:1, textAlign:'center', fontSize:'2.2rem', color:'#FFD15E' }}>
            Learning Games 🎮
          </h1>
          <div style={{ width:'120px' }} />
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding:'2.5rem', flex:1 }}>
          {!activeGame ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'1.5rem' }}>
              {GAMES.map(game => (
                <div key={game.id} className="hover-lift" onClick={() => setActiveGame(game.id)} style={{
                  background: isDark ? `${game.color}12` : game.bg,
                  borderRadius:'var(--radius-lg)',
                  border:`2px solid ${game.color}40`, padding:'2rem',
                  textAlign:'center', cursor:'pointer', boxShadow:'var(--shadow-sm)',
                  transition:'all 0.25s'
                }}>
                  <div style={{ fontSize:'3.5rem', marginBottom:'0.75rem', animation:'float 3s ease-in-out infinite' }}>{game.icon}</div>
                  <h3 style={{ fontSize:'1.3rem', marginBottom:'0.4rem', color:'var(--text-main)' }}>{game.title}</h3>
                  <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>{game.desc}</p>
                  <span className={`badge badge-${game.difficulty.toLowerCase()}`}>{game.difficulty}</span>
                </div>
              ))}
            </div>
          ) : (
            renderGame()
          )}
        </div>
      </main>
    </div>
  );
}