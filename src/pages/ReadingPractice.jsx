import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from '../components/AudioPlayer';
import AnimatedButton from '../components/AnimatedButton';
import CelebrationModal from '../components/CelebrationModal';
import { logReadingSession, logConfusionPattern } from '../services/progressService';
import {
  analyzeDyslexicConfusion,
  getCheerfulMessage,
  confusionMap,
} from '../services/dyslexiaEngine';

// ============================================================
// CONTENT LIBRARY
// ============================================================
const CATEGORIES = [
  { id: 'alphabet',     label: '🔤 Alphabet',       color: '#4DAAFF', bg: '#EEF6FF'  },
  { id: 'vocabulary',   label: '📝 Vocabulary',     color: '#5DD87A', bg: '#EDFFF5'  },
  { id: 'phonics',      label: '🔊 Phonics',         color: '#B07FFF', bg: '#F4EEFF'  },
  { id: 'sentences',    label: '📃 Sentences',       color: '#FFD15E', bg: '#FFFBED'  },
  { id: 'stories',      label: '📖 Stories',         color: '#FF9A5E', bg: '#FFF2E8'  },
  { id: 'comprehension',label: '🧠 Comprehension',  color: '#3ECFA8', bg: '#EDFFF5'  },
];

const EXERCISES = {
  alphabet: [
    { id:'a1', title:'Letter A', text:'A is for Apple. The apple is red and round.', difficulty:1 },
    { id:'a2', title:'Letter B', text:'B is for Ball. The ball is big and blue.', difficulty:1 },
    { id:'a3', title:'Letter C', text:'C is for Cat. The cat is cute and calm.', difficulty:1 },
    { id:'a4', title:'Letter D', text:'D is for Dog. The dog is happy and friendly.', difficulty:1 },
    { id:'a5', title:'Letter E', text:'E is for Egg. The egg is small and oval.', difficulty:1 },
    { id:'a6', title:'Letters F & G', text:'F is for Fish. G is for Goat. Fish swim, goats run!', difficulty:2 },
    { id:'a7', title:'Letters H & I', text:'H is for Hat. I is for Ice. A hat keeps you warm; ice keeps things cold.', difficulty:2 },
  ],
  vocabulary: [
    { id:'v1', title:'Animals', text:'Dog, Cat, Bird, Fish, Rabbit, Horse, Elephant, Lion', difficulty:1 },
    { id:'v2', title:'Colours', text:'Red, Blue, Green, Yellow, Purple, Orange, Pink, White, Black', difficulty:1 },
    { id:'v3', title:'Numbers', text:'One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten', difficulty:1 },
    { id:'v4', title:'Food', text:'Apple, Banana, Carrot, Bread, Milk, Egg, Rice, Cheese, Orange', difficulty:1 },
    { id:'v5', title:'Body Parts', text:'Head, Eyes, Ears, Nose, Mouth, Hands, Feet, Knees, Shoulders', difficulty:2 },
    { id:'v6', title:'Weather Words', text:'Sunny, Cloudy, Rainy, Windy, Stormy, Foggy, Snowy, Hot, Cold', difficulty:2 },
    { id:'v7', title:'Action Words', text:'Run, Jump, Swim, Read, Write, Sing, Dance, Sleep, Eat, Play', difficulty:2 },
    { id:'v8', title:'Feelings', text:'Happy, Sad, Angry, Excited, Scared, Calm, Proud, Surprised, Tired', difficulty:3 },
  ],
  phonics: [
    { id:'p1', title:'Short A sounds', text:'Cat sat on a mat. The fat rat ran fast.', difficulty:1 },
    { id:'p2', title:'Short E sounds', text:'The red hen went to bed. She fed ten men.', difficulty:1 },
    { id:'p3', title:'Short I sounds', text:'The big pig can dig. It sits in a bit of mud.', difficulty:1 },
    { id:'p4', title:'Short O sounds', text:'A hot dog sat on a log. The fog was so strong.', difficulty:1 },
    { id:'p5', title:'Short U sounds', text:'The pup runs in the mud. It cups water from a tub.', difficulty:2 },
    { id:'p6', title:'Long A sounds', text:'The snail waits in the rain. Jane plays a game on the lane.', difficulty:2 },
    { id:'p7', title:'Long E sounds', text:'The bee sees a tree near the sea. She feels free and at ease.', difficulty:2 },
    { id:'p8', title:'Blends: BL, CL, FL', text:'The black cloud floats. Clare blows flowers into the breeze.', difficulty:3 },
  ],
  sentences: [
    { id:'s1', title:'Level 1 Sentences', text:'The dog is big. The cat is small. I like red apples.', difficulty:1 },
    { id:'s2', title:'Level 2 Sentences', text:'Sam can run fast. The sun is very bright today. Birds can fly up high.', difficulty:1 },
    { id:'s3', title:'Questions', text:'Where is my hat? Can you see the dog? What time is it?', difficulty:2 },
    { id:'s4', title:'Describing Things', text:'The tall giraffe has long yellow legs. The fluffy white cloud drifts slowly across the bright blue sky.', difficulty:2 },
    { id:'s5', title:'Action Sentences', text:'Emma jumped over the puddle. The children played happily at the park until sunset.', difficulty:3 },
    { id:'s6', title:'Complex Sentences', text:'Although it was raining, Tom wanted to go outside to play football with his friends.', difficulty:3 },
  ],
  stories: [
    { id:'st1', title:'The Little Cat', text:'The little cat sat on a warm mat. She purred softly and blinked her big green eyes. A small mouse ran past. The cat lifted her paw, but the mouse was too fast! The cat went back to sleep on her cosy mat.', difficulty:1 },
    { id:'st2', title:'A Day at the Park', text:'Sam and his sister Lily went to the park. Sam ran to the big red slide and whooshed down quickly. Lily found a pretty flower near the pond. They fed the ducks and watched them swim. Before going home, they had ice cream. It was the best day ever!', difficulty:1 },
    { id:'st3', title:'The Magic Paintbrush', text:'Mia found a golden paintbrush on the beach. Whatever she painted came to life! She painted a rainbow and it appeared in the sky. She painted a puppy and it jumped into her arms. But she was careful never to paint anything scary. She used her gift to make the world more beautiful.', difficulty:2 },
    { id:'st4', title:'The Brave Little Robot', text:'Sparky the robot was small but very brave. One day the school lost all its electricity. Sparky opened his chest panel and used his own battery to power the lights. All the children cheered. From that day on, Sparky was the hero of the school — the bravest little robot of all!', difficulty:2 },
    { id:'st5', title:'Stars and Wishes', text:'Every night, Zara watched the stars from her bedroom window. She believed each star held a wish. One night, a shooting star zoomed past. She closed her eyes tight and made her wish: that everyone in the world could have a good friend. The next day at school, she decided to be that friend herself.', difficulty:3 },
  ],
  comprehension: [
    {
      id:'c1', title:'The Lost Puppy', difficulty:1,
      text:'A puppy named Biscuit got lost in the park. He was brown with a white spot on his nose. A kind girl named Priya found him sitting under a tree. She gave him water and read his tag. She took him home to his family. Everyone was so happy!',
      questions: [
        { q: 'What was the puppy\'s name?',     options:['Biscuit','Cookie','Spot','Fluffy'], answer:0 },
        { q: 'Where was the puppy found?',      options:['In a shop','Under a tree','In a garden','At school'], answer:1 },
        { q: 'Who found the puppy?',            options:['A boy','A teacher','Priya','A police officer'], answer:2 },
      ]
    },
    {
      id:'c2', title:'The Rainy Day', difficulty:2,
      text:'Leo wanted to play football but it was raining. His mum suggested they bake cookies instead. Leo stirred the dough while his mum set the oven. While the cookies baked, they played a board game. The rain stopped just as the timer pinged. Leo ate two warm cookies and said it was the best rainy day ever.',
      questions: [
        { q: 'Why couldn\'t Leo play football?',     options:['He was ill','It was raining','He had homework','It was dark'], answer:1 },
        { q: 'What did they bake?',                  options:['Cake','Bread','Pizza','Cookies'], answer:3 },
        { q: 'What did they do while the cookies baked?', options:['Watched TV','Read books','Played a board game','Slept'], answer:2 },
      ]
    },
    {
      id:'c3', title:'Journey to the Moon', difficulty:3,
      text:'Commander Ana was the youngest astronaut to pilot a spacecraft. Her mission was to collect moon rocks. After a long journey through the dark silence of space, she touched down on the dusty grey surface. She filled her container with three grey rocks and planted a flag. On the flight home, she looked back at the small blue Earth and felt very proud.',
      questions: [
        { q: 'What was Ana\'s mission?',            options:['Plant trees','Collect moon rocks','Take photos','Build a rocket'], answer:1 },
        { q: 'How did Ana feel on the way home?',   options:['Scared','Bored','Sick','Proud'], answer:3 },
        { q: 'What did she plant on the moon?',     options:['A tree','A flower','A flag','A sign'], answer:2 },
      ]
    },
  ],
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function TextSizeControl({ size, onChange }) {
  const sizes = ['S','M','L','XL'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
      <span style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:600 }}>Text:</span>
      {sizes.map(s => (
        <button key={s} onClick={() => onChange(s)}
          className={`text-size-btn${size === s ? ' active' : ''}`}
        >{s}</button>
      ))}
    </div>
  );
}

// ============================================================
// DYSLEXIA HELPERS
// ============================================================

/**
 * Returns a JSX array with dyslexic-prone letters highlighted in red.
 */
function HighlightedText({ text, fontSize, catColor, activeWord }) {
  const words = text.split(' ');
  return (
    <div style={{ fontSize, lineHeight:2.2, textAlign:'center', fontFamily:'var(--font-primary)', letterSpacing:'0.5px' }}>
      {words.map((word, wi) => {
        const isActive = activeWord === wi;
        return (
          <span key={wi} style={{
            display:'inline-block', marginRight:'8px', marginBottom:'6px',
            padding:'2px 8px', borderRadius:'8px',
            backgroundColor: isActive ? catColor : 'transparent',
            color: isActive ? 'white' : 'inherit',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            fontWeight: isActive ? 700 : 500,
            transition:'all 0.15s ease'
          }}>
            {word.split('').map((ch, ci) => {
              const lower = ch.toLowerCase();
              const isDyslexic = !!confusionMap[lower];
              return (
                <span
                  key={ci}
                  className={isDyslexic && !isActive ? 'dyslexia-highlight' : ''}
                  title={isDyslexic ? `'${ch}' is often confused with '${[...confusionMap[lower]].join("', '")}'` : undefined}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================
// DYSLEXIA CHALLENGE PANEL
// ============================================================
function DyslexiaChallenge({ text, onComplete }) {
  // Pick a representative short phrase or first sentence
  const targetPhrase = text.split('.')[0].trim();
  const [typed,    setTyped]    = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [analysis,  setAnalysis]  = useState(null);
  const [popup,     setPopup]     = useState(null);

  const handleCheck = () => {
    if (!typed.trim()) return;
    console.log('[ReadingPractice] DyslexiaChallenge — checking:', { target: targetPhrase, typed });
    const result = analyzeDyslexicConfusion(targetPhrase, typed);
    console.log('[ReadingPractice] DyslexiaChallenge result:', result);
    setAnalysis(result);
    setSubmitted(true);

    // Log confusion patterns
    logConfusionPattern(result.confusedLetters, result.accuracy);

    // Show cheerful popup
    const msg = getCheerfulMessage(result.accuracy, result.confusedLetters);
    setPopup({ message: msg, score: result.accuracy });
    setTimeout(() => setPopup(null), 3500);
  };

  // Deduplicate confused pairs for display
  const confusedPairs = {};
  (analysis?.confusedLetters || []).forEach(({ expected, got }) => {
    const key = [expected, got].sort().join(' ↔ ');
    confusedPairs[key] = (confusedPairs[key] || 0) + 1;
  });

  return (
    <div className="dyslexia-challenge-panel">
      {/* Inline popup */}
      {popup && (
        <div style={{
          padding:'0.9rem 1.4rem',
          background: popup.score >= 75
            ? 'linear-gradient(135deg, #5DD87A, #3ECFA8)'
            : popup.score >= 50
            ? 'linear-gradient(135deg, #FFD15E, #FF9A5E)'
            : 'linear-gradient(135deg, #B07FFF, #4DAAFF)',
          borderRadius:'var(--radius-md)',
          color: popup.score >= 50 && popup.score < 75 ? '#3a2000' : 'white',
          fontWeight:800, fontSize:'1rem', textAlign:'center',
          animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          {popup.message}
        </div>
      )}

      <div>
        <p className="dyslexia-challenge-label">
          🧠 Dyslexia Challenge — Type what you read:
        </p>
        <p className="dyslexia-challenge-phrase">
          "{targetPhrase}"
        </p>
      </div>

      {!submitted ? (
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="Type the phrase you just read…"
            className="dyslexia-challenge-input"
          />
          <AnimatedButton variant="primary" size="sm" onClick={handleCheck} disabled={!typed.trim()}>
            Check ✓
          </AnimatedButton>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {/* Accuracy */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, color:'var(--text-main)', fontSize:'0.9rem' }}>Letter Accuracy</span>
            <span style={{
              fontWeight:900, fontSize:'1.1rem',
              color: analysis.accuracy >= 80 ? '#5DD87A' : analysis.accuracy >= 50 ? '#FF9A5E' : '#FF7B7B',
            }}>
              {analysis.accuracy}%
            </span>
          </div>
          <div className="metric-bar-track">
            <div style={{
              height:'100%', borderRadius:'6px',
              width:`${analysis.accuracy}%`,
              background: analysis.accuracy >= 80
                ? 'linear-gradient(90deg, #5DD87A, #3ECFA8)'
                : analysis.accuracy >= 50
                ? 'linear-gradient(90deg, #FFD15E, #FF9A5E)'
                : 'linear-gradient(90deg, #FF7B7B, #FF4444)',
              transition:'width 1s ease',
            }} />
          </div>

          {/* Hits / Misses */}
          <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.85rem', color:'var(--text-muted)' }}>
            <span>✅ Hits: <strong style={{ color:'#5DD87A' }}>{analysis.hits}</strong></span>
            <span>❌ Misses: <strong style={{ color:'#FF7B7B' }}>{analysis.misses}</strong></span>
          </div>

          {/* Confusion badges */}
          {Object.keys(confusedPairs).length > 0 && (
            <div>
              <p style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'6px' }}>
                🔤 Letters confused:
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {Object.entries(confusedPairs).map(([pair, count]) => (
                  <span key={pair} className="confusion-badge">
                    {pair.toUpperCase()} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Try again / continue */}
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
            <AnimatedButton variant="outline" size="sm" onClick={() => { setTyped(''); setSubmitted(false); setAnalysis(null); }}>
              🔄 Try Again
            </AnimatedButton>
            <AnimatedButton variant="success" size="sm" onClick={() => onComplete(analysis.accuracy, analysis.confusedLetters)}>
              Continue ➡️
            </AnimatedButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ComprehensionQuiz({ questions, onFinish }) {
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct,  setCorrect]  = useState(0);
  const [done,     setDone]     = useState(false);

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].answer) setCorrect(c => c + 1);
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 900);
  };

  if (done) {
    const score = Math.round((correct / questions.length) * 100);
    return (
      <div className="animate-fade-in" style={{ textAlign:'center', padding:'1.5rem' }}>
        <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem' }}>{score >= 67 ? '🌟' : '💪'}</div>
        <h3 style={{ fontSize:'1.8rem', marginBottom:'0.5rem' }}>
          {score >= 67 ? 'Well done!' : 'Good try!'}
        </h3>
        <p style={{ color:'var(--text-muted)', marginBottom:'1.5rem' }}>
          You got {correct} out of {questions.length} questions right!
        </p>
        <AnimatedButton variant="primary" onClick={() => onFinish(score)}>
          Continue ➡️
        </AnimatedButton>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="animate-fade-in">
      <p style={{ fontWeight:600, color:'var(--text-muted)', marginBottom:'0.5rem', fontSize:'0.95rem' }}>
        Question {current + 1} of {questions.length}
      </p>
      <h3 style={{ fontSize:'1.4rem', marginBottom:'1.5rem', lineHeight:1.4, color:'var(--text-main)' }}>{q.q}</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {q.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (selected !== null) {
            if (i === q.answer) cls += ' correct';
            else if (i === selected) cls += ' wrong';
          }
          return (
            <button key={i}
              className={cls}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              {i === q.answer && selected !== null ? '✅ ' : ''}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ReadingPractice() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [selectedCat,      setSelectedCat]      = useState(null);
  const [exerciseIdx,      setExerciseIdx]      = useState(0);
  const [activeWord,       setActiveWord]       = useState(null);
  const [textSize,         setTextSize]         = useState('M');
  const [showQuiz,         setShowQuiz]         = useState(false);
  const [showChallenge,    setShowChallenge]    = useState(false);
  const [challengeEnabled, setChallengeEnabled] = useState(true);
  const [celebration,      setCelebration]      = useState(false);
  const [celebScore,       setCelebScore]       = useState(0);

  const fontSizeMap = { S:'1.3rem', M:'1.8rem', L:'2.2rem', XL:'2.8rem' };

  const exercises = selectedCat ? EXERCISES[selectedCat] : [];
  const exercise  = exercises[exerciseIdx] || null;
  const isLastEx  = exerciseIdx === exercises.length - 1;

  const proceedNext = useCallback((score = 90) => {
    if (!exercise) return;
    logReadingSession(score, exercise.difficulty);
    setShowChallenge(false);
    setActiveWord(null);
    setShowQuiz(false);
    window.speechSynthesis?.cancel();
    if (isLastEx) {
      setCelebScore(score);
      setCelebration(true);
    } else {
      setExerciseIdx(i => i + 1);
    }
  }, [exercise, isLastEx]);

  const handleNext = useCallback(() => {
    if (challengeEnabled && !showChallenge && !exercise?.questions) {
      setShowChallenge(true);
      window.speechSynthesis?.cancel();
    } else {
      proceedNext();
    }
  }, [challengeEnabled, showChallenge, exercise, proceedNext]);

  const handleChallengeComplete = (dyslexiaAccuracy) => {
    console.log('[ReadingPractice] Challenge done, accuracy:', dyslexiaAccuracy);
    proceedNext(Math.round(dyslexiaAccuracy));
  };

  const handleCelebClose = () => {
    setCelebration(false);
    setSelectedCat(null);
    setExerciseIdx(0);
    setShowQuiz(false);
    setShowChallenge(false);
  };

  // Category selection screen
  if (!selectedCat) {
    return (
      <div className="app-container">
        <Navbar user={user} onLogout={signOut} />
        {celebration && <CelebrationModal onClose={handleCelebClose} score={celebScore} title="Category Complete! 🎉" />}
        <main style={{ flex:1, padding:'2rem', maxWidth:'900px', margin:'0 auto', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', marginBottom:'2rem' }}>
            <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/')}>
              ⬅️ Home
            </AnimatedButton>
            <h1 style={{ flex:1, textAlign:'center', fontSize:'2.2rem', color:'var(--color-primary)' }}>
              Reading Practice 📖
            </h1>
            <div style={{ width:'80px' }} />
          </div>
          <p style={{ textAlign:'center', color:'var(--text-muted)', marginBottom:'2.5rem', fontSize:'1.1rem' }}>
            Choose a category to start reading!
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem' }}>
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                className="practice-cat-card hover-lift"
                onClick={() => { setSelectedCat(cat.id); setExerciseIdx(0); }}
                style={{
                  background: cat.bg,
                  border:`2px solid ${cat.color}40`,
                }}
              >
                <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>{cat.label.split(' ')[0]}</div>
                <h3 style={{ fontSize:'1.25rem', color:'var(--text-main)', marginBottom:'0.4rem', fontWeight:800 }}>
                  {cat.label.split(' ').slice(1).join(' ')}
                </h3>
                <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', fontWeight:600 }}>
                  {EXERCISES[cat.id]?.length || 0} exercises
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Exercise screen
  const catMeta = CATEGORIES.find(c => c.id === selectedCat);

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={signOut} />
      {celebration && <CelebrationModal onClose={handleCelebClose} score={celebScore} title="All done! Great reading! 📖" />}

      <main style={{ flex:1, padding:'2rem', maxWidth:'820px', margin:'0 auto', width:'100%', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:'1.5rem', gap:'0.5rem', flexWrap:'wrap' }}>
          <AnimatedButton variant="ghost" size="sm" onClick={() => { setSelectedCat(null); setExerciseIdx(0); window.speechSynthesis?.cancel(); }}>
            ⬅️ Categories
          </AnimatedButton>
          <div style={{ flex:1, textAlign:'center' }}>
            <h1 style={{ fontSize:'1.8rem', color: catMeta?.color }}>{catMeta?.label}</h1>
          </div>
          <TextSizeControl size={textSize} onChange={setTextSize} />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontSize:'0.9rem', color:'var(--text-muted)', fontWeight:600 }}>
            <span>{exerciseIdx + 1} of {exercises.length}</span>
            <span className="badge badge-easy">{exercise?.difficulty === 1 ? 'Easy' : exercise?.difficulty === 2 ? 'Medium' : 'Hard'}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{
              background: `linear-gradient(90deg, ${catMeta?.color}, ${catMeta?.color}cc)`,
              width: `${((exerciseIdx + 1) / exercises.length) * 100}%`,
              transition:'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Exercise */}
        <div className="glass-panel animate-fade-in" style={{ padding:'2.5rem', display:'flex', flexDirection:'column', gap:'1.5rem', flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
            <h2 style={{ fontSize:'2rem', color: catMeta?.color }}>{exercise?.title}</h2>
            {!showQuiz && !showChallenge && (
              <button
                onClick={() => setChallengeEnabled(e => !e)}
                title={challengeEnabled ? 'Disable dyslexia challenge' : 'Enable dyslexia challenge'}
                className={`challenge-toggle-btn ${challengeEnabled ? 'on' : 'off'}`}
              >
                {challengeEnabled ? '🧠 Challenge ON' : '🧠 Challenge OFF'}
              </button>
            )}
          </div>

          {/* Dyslexia challenge panel */}
          {showChallenge && exercise && (
            <DyslexiaChallenge
              key={exercise.id + '-challenge'}
              text={exercise.text}
              onComplete={handleChallengeComplete}
            />
          )}

          {/* Text with letter + word highlighting */}
          {!showQuiz && !showChallenge && (
            <HighlightedText
              text={exercise?.text || ''}
              fontSize={fontSizeMap[textSize]}
              catColor={catMeta?.color}
              activeWord={activeWord}
            />
          )}

          {/* Comprehension quiz */}
          {showQuiz && exercise?.questions && (
            <ComprehensionQuiz
              questions={exercise.questions}
              onFinish={(score) => { setShowQuiz(false); logReadingSession(score, exercise.difficulty); proceedNext(score); }}
            />
          )}

          {/* TTS Player */}
          {!showQuiz && !showChallenge && (
            <div style={{ alignSelf:'center' }}>
              <AudioPlayer text={exercise?.text} onWordChange={setActiveWord} />
            </div>
          )}

          {/* Navigation */}
          {!showQuiz && !showChallenge && (
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'auto', gap:'1rem' }}>
              <AnimatedButton variant="outline" onClick={() => { setExerciseIdx(i => Math.max(0, i-1)); setActiveWord(null); setShowChallenge(false); window.speechSynthesis?.cancel(); }} disabled={exerciseIdx === 0}>
                ⬅️ Previous
              </AnimatedButton>
              {exercise?.questions && selectedCat === 'comprehension' ? (
                <AnimatedButton variant="primary" onClick={() => setShowQuiz(true)}>
                  Answer Questions 🧠
                </AnimatedButton>
              ) : (
                <AnimatedButton variant="primary" onClick={handleNext}>
                  {isLastEx ? '🎉 Finish' : challengeEnabled ? 'Next: Challenge 🧠' : 'Next ➡️'}
                </AnimatedButton>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}