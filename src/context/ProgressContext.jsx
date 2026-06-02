/**
 * ProgressContext.jsx
 * ──────────────────────────────────────────────────────────────
 * Single source of truth for progress data across all components.
 * - Reads localStorage immediately (instant render)
 * - Merges Supabase cloud data when user is logged in
 * - Exposes refreshProgress() so any page can trigger a re-read
 * - Fires on storage events so multi-tab stays in sync
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getProgress,
  fetchProgressFromSupabase,
  fetchAttemptsFromSupabase,
} from '../services/progressService';
import { mergeConfusionHistory } from '../services/dyslexiaEngine';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(() => getProgress());   // instant from localStorage
  const [confusionHistory, setConfusionHistory] = useState({});
  const [loading, setLoading] = useState(false);

  // ── Core loader ─────────────────────────────────────────────
  const loadProgress = useCallback(async () => {
    // 1) Always start with localStorage
    const local = getProgress();
    setProgress(local);
    setConfusionHistory(local.confusionHistory || {});

    if (!user?.id) return;

    setLoading(true);
    try {
      // 2) Fetch cloud summary and merge over local
      const [cloud, attempts] = await Promise.all([
        fetchProgressFromSupabase(user.id),
        fetchAttemptsFromSupabase(user.id, 50),
      ]);

      if (cloud) {
        setProgress(prev => ({
          ...prev,
          totalPoints:        cloud.total_points       ?? prev.totalPoints,
          lessonsCompleted:   cloud.lessons_completed  ?? prev.lessonsCompleted,
          avgAccuracy:        cloud.avg_accuracy        ?? prev.avgAccuracy,
          streakDays:         cloud.streak_days         ?? prev.streakDays,
          readingLevel:       cloud.reading_level       ?? prev.readingLevel,
          speechLevel:        cloud.speech_level        ?? prev.speechLevel,
          gameLevel:          cloud.game_level          ?? prev.gameLevel,
          badges:             cloud.badges              ?? prev.badges,
        }));
      }

      // 3) Aggregate confused_letters from Supabase attempts → confusionHistory
      if (attempts?.length) {
        let merged = { ...(local.confusionHistory || {}) };
        for (const attempt of attempts) {
          const cl = attempt.confused_letters;
          if (Array.isArray(cl) && cl.length) {
            merged = mergeConfusionHistory(merged, cl);
          }
        }
        setConfusionHistory(merged);
      }
    } catch (e) {
      console.error('[ProgressContext] loadProgress error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ── Load on mount / user change ──────────────────────────────
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Re-sync on localStorage change (same tab via custom event OR other tabs via storage event)
  useEffect(() => {
    const handler = (e) => {
      // 'storage' fires for other tabs; 'lexilearn:progress' fires for same tab
      if (e?.key === 'lexilearn_progress' || e?.type === 'lexilearn:progress' || !e) {
        loadProgress();
      }
    };
    window.addEventListener('storage', handler);
    window.addEventListener('lexilearn:progress', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('lexilearn:progress', handler);
    };
  }, [loadProgress]);

  const value = {
    progress,
    confusionHistory,
    loading,
    refreshProgress: loadProgress,
    // Convenience shortcut used by Navbar
    totalPoints: progress?.totalPoints ?? 0,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
