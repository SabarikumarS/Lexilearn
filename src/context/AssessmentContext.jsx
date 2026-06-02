/**
 * AssessmentContext.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Global state for assessment status and user learning profile.
 * - assessmentDone: whether the user has completed the pre-assessment
 * - userProfile: full profile (skill level, weak areas, learning path, XP, badges)
 * - Reads from Supabase for logged-in users, localStorage for guests
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchUserProfile,
  getUserProfileLocally,
  hasCompletedAssessment,
  hasCompletedAssessmentLocally,
  SKILL_LEVEL_CONFIG,
} from '../services/assessmentService';

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const { user } = useAuth();

  const [userProfile, setUserProfile]       = useState(null);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Load profile ──────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      if (user?.id) {
        // Logged-in: try Supabase first, fall back to localStorage
        const cloud = await fetchUserProfile(user.id);
        if (cloud) {
          setUserProfile({
            skillLevel:    cloud.skill_level,
            strengths:     cloud.strengths || [],
            weakAreas:     cloud.weak_areas || [],
            errorPatterns: cloud.dyslexia_patterns || {},
            learningPath:  cloud.learning_path || [],
            learningRate:  cloud.learning_rate || 'average',
            xp:            cloud.xp || 0,
            badges:        cloud.badges || [],
            assessmentDone: cloud.assessment_done,
            userId:        user.id,
          });
          setAssessmentDone(cloud.assessment_done === true);
        } else {
          // Check localStorage as fallback
          const local = getUserProfileLocally();
          if (local) {
            setUserProfile(local);
            setAssessmentDone(local.assessment_done === true);
          } else {
            setAssessmentDone(false);
          }
        }
      } else {
        // Guest: only localStorage
        const local = getUserProfileLocally();
        if (local) {
          setUserProfile(local);
          setAssessmentDone(local.assessment_done === true);
        } else {
          setAssessmentDone(false);
        }
      }
    } catch (e) {
      console.error('[AssessmentContext] loadProfile error:', e);
      setAssessmentDone(false);
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  // ── Mount + user change ───────────────────────────────────────────
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Listen for profile update event (after assessment completes) ──
  useEffect(() => {
    const handler = () => loadProfile();
    window.addEventListener('lexilearn:profile', handler);
    return () => window.removeEventListener('lexilearn:profile', handler);
  }, [loadProfile]);

  // ── Derived helpers ───────────────────────────────────────────────
  const skillConfig = userProfile?.skillLevel
    ? SKILL_LEVEL_CONFIG[userProfile.skillLevel] || SKILL_LEVEL_CONFIG.beginner
    : null;

  const topRecommendations = (userProfile?.learningPath || [])
    .filter(item => item.priority === 'high' || item.priority === 'medium')
    .slice(0, 3);

  const value = {
    userProfile,
    assessmentDone,
    loadingProfile,
    skillConfig,
    topRecommendations,
    refreshProfile: loadProfile,
    // Convenience shorthand
    skillLevel:   userProfile?.skillLevel   || 'beginner',
    learningRate: userProfile?.learningRate  || 'average',
    weakAreas:    userProfile?.weakAreas     || [],
    learningPath: userProfile?.learningPath  || [],
    xp:           userProfile?.xp            || 0,
    badges:       userProfile?.badges        || [],
    userId:       userProfile?.userId        || null,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used inside <AssessmentProvider>');
  return ctx;
}
