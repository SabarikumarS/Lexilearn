import React, { useState, useEffect } from 'react';
import AnimatedButton from './AnimatedButton';

export default function AudioPlayer({ text, autoPlay = false, onWordChange, onEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech when component mounts/unmounts
    window.speechSynthesis.cancel();
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (onWordChange) onWordChange(null);
      return;
    }

    const newUtterance = new SpeechSynthesisUtterance(text);
    // Use a friendly, slow voice if possible
    newUtterance.rate = 0.8; // Slower rate for children with dyslexia
    newUtterance.pitch = 1.1; // Slightly higher pitch for friendly tone
    
    newUtterance.onstart = () => setIsPlaying(true);
    newUtterance.onend = () => {
      setIsPlaying(false);
      if (onWordChange) onWordChange(null);
      if (onEnd) onEnd();
    };
    newUtterance.onerror = () => {
      setIsPlaying(false);
      if (onWordChange) onWordChange(null);
      if (onEnd) onEnd();
    };

    // Word highlighting support
    newUtterance.onboundary = (event) => {
      if (event.name === 'word' && onWordChange) {
        // Find which word index we're currently speaking based on charIndex
        const words = text.split(' ');
        let charCount = 0;
        let wordIndex = 0;
        
        for (let i = 0; i < words.length; i++) {
          if (charCount >= event.charIndex) {
            wordIndex = i > 0 ? i - 1 : 0;
            break;
          }
          charCount += words[i].length + 1; // +1 for the space
        }
        
        // Exact match or fallback approximation
        onWordChange(wordIndex);
      }
    };

    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
  };

  return (
    <AnimatedButton 
      variant={isPlaying ? "warning" : "primary"} 
      onClick={handlePlay}
      className={`audio-btn ${isPlaying ? 'animate-pulse' : ''}`}
    >
      <span style={{ fontSize: '1.5rem' }}>{isPlaying ? '⏹️' : '🔊'}</span>
      {isPlaying ? 'Stop Listening' : 'Listen to Story'}
    </AnimatedButton>
  );
}