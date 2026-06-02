import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProgressProvider } from './context/ProgressContext';
import { AssessmentProvider } from './context/AssessmentContext';
import Dashboard from './pages/Dashboard';
import ReadingPractice from './pages/ReadingPractice';
import SpeechPractice from './pages/SpeechPractice';
import LearningGames from './pages/LearningGames';
import ProgressTracker from './pages/ProgressTracker';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import PreAssessment from './pages/PreAssessment';
import LearningPath from './pages/LearningPath';

/**
 * All routes are open to everyone — guests and logged-in users alike.
 * Personalization is unlocked through the assessment CTA on the dashboard.
 * No force-redirect guards.
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProgressProvider>
          <AssessmentProvider>
            <Routes>
              {/* ── Open to all ── */}
              <Route path="/"              element={<Dashboard />} />
              <Route path="/reading"       element={<ReadingPractice />} />
              <Route path="/speech"        element={<SpeechPractice />} />
              <Route path="/games"         element={<LearningGames />} />
              <Route path="/progress"      element={<ProgressTracker />} />
              <Route path="/profile"       element={<ProfilePage />} />
              <Route path="/assessment"    element={<PreAssessment />} />
              <Route path="/learning-path" element={<LearningPath />} />

              {/* ── Auth ── */}
              <Route path="/login"  element={<AuthPage defaultTab="login" />} />
              <Route path="/signup" element={<AuthPage defaultTab="signup" />} />
            </Routes>
          </AssessmentProvider>
        </ProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;