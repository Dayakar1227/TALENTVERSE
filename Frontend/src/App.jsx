import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

import LandingPage       from './pages/LandingPage.jsx';
import AuthPage          from './pages/AuthPage.jsx';
import Dashboard         from './pages/Dashboard.jsx';
import PortfolioUpload   from './pages/PortfolioUpload.jsx';
import JobsPage          from './pages/JobsPage.jsx';
import CandidatesPage    from './pages/CandidatesPage.jsx';
import CompanyProfile    from './pages/CompanyProfile.jsx';
import CollaborationsPage from './pages/CollaborationsPage.jsx';
import PublicProfile     from './pages/PublicProfile.jsx';
import LearningPage      from './pages/LearningPage.jsx';
import SettingsPage      from './pages/SettingsPage.jsx';
import Navbar            from './components/Navbar.jsx';
import Sidebar           from './components/Sidebar.jsx';
import ProfileDetailsModal from './components/ProfileDetailsModal.jsx';
import EditProfileModal from './components/EditProfileModal.jsx';
import { clearToken, getCurrentUser, getToken, logoutUser } from './lib/api.js';

const ACCOUNT_MODE_KEY = 'talentverse_account_mode';

function canUseRecruiterMode(user) {
  return user?.accountRoles?.includes('RECRUITER') || user?.role === 'RECRUITER';
}

// ─── Animated route wrapper ───────────────────────────────────────────────────
function AnimatedRoutes({ user, handleLogin, handleLogout, isDarkMode, onToggleDarkMode, onOpenProfile, onEditProfile, onUserUpdate, accountMode, onAccountModeChange }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="auth-routes"
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 page-motion"
        >
          <Routes location={location}>
            <Route path="/"     element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="*"     element={<Navigate to="/" />} />
          </Routes>
        </motion.div>
      ) : (
        <div className="flex flex-1" key="app-main">
          <Sidebar user={user} onLogout={handleLogout} accountMode={accountMode} />
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            <Navbar
              user={user}
              onOpenProfile={onOpenProfile}
              onEditProfile={onEditProfile}
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
              accountMode={accountMode}
              onAccountModeChange={onAccountModeChange}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 18, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="page-motion"
                >
                  <Routes location={location}>
                    <Route path="/dashboard"      element={<Dashboard user={user} accountMode={accountMode} />} />
                    <Route path="/upload"         element={<PortfolioUpload user={user} />} />
                    <Route path="/jobs"           element={<JobsPage user={user} onUserUpdate={onUserUpdate} accountMode={accountMode} onAccountModeChange={onAccountModeChange} />} />
                    <Route path="/candidates"     element={accountMode === 'RECRUITER' ? <CandidatesPage user={user} /> : <Navigate to="/jobs" />} />
                    <Route path="/collaborations" element={<CollaborationsPage user={user} />} />
                    <Route path="/learning"       element={accountMode === 'RECRUITER' ? <Navigate to="/candidates" /> : <LearningPage user={user} />} />
                    <Route path="/settings"       element={<SettingsPage user={user} isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />} />
                    <Route path="/company/:id"    element={<CompanyProfile user={user} />} />
                    <Route path="/profile/:id"    element={<PublicProfile />} />
                    <Route path="*"               element={<Navigate to="/dashboard" />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('talentverse_theme') === 'dark');
  const [accountMode, setAccountMode] = useState(() => localStorage.getItem(ACCOUNT_MODE_KEY) || 'JOB_SEEKER');
  const [themeMotionKey, setThemeMotionKey] = useState(0);
  const [isThemeAnimating, setIsThemeAnimating] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('talentverse_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (user && accountMode === 'RECRUITER' && !canUseRecruiterMode(user)) {
      setAccountMode('JOB_SEEKER');
      return;
    }
    localStorage.setItem(ACCOUNT_MODE_KEY, accountMode);
  }, [accountMode, user]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      localStorage.removeItem('talentverse_user');

      if (!getToken()) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        clearToken();
        if (active) setUser(null);
      } finally {
        if (active) setIsRestoringSession(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = (u) => {
    setUser(u);
  };

  const handleLogout = async () => {
    setUser(null);
    setAccountMode('JOB_SEEKER');
    setIsProfileOpen(false);
    setIsEditProfileOpen(false);
    await logoutUser();
  };

  const handleToggleDarkMode = () => {
    setThemeMotionKey((value) => value + 1);
    setIsThemeAnimating(true);
    setIsDarkMode((value) => !value);
    window.setTimeout(() => setIsThemeAnimating(false), 1200);
  };

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading TalentVerse...
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen overflow-hidden bg-slate-50 transition-colors duration-500 ease-out dark:bg-slate-950">
        <AnimatePresence>
          {isThemeAnimating && (
            <motion.div
              key={isDarkMode ? 'theme-wash-dark' : 'theme-wash-light'}
              initial={{ scale: 0, opacity: 0.78 }}
              animate={{ scale: 3.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-none fixed right-6 top-4 z-[80] h-44 w-44 rounded-full blur-2xl ${
                isDarkMode ? 'bg-slate-950' : 'bg-white'
              }`}
            />
          )}
        </AnimatePresence>
        <motion.div
          key={themeMotionKey}
          initial={{ scale: 0.94, opacity: 0.9, filter: 'blur(1.5px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen flex flex-col origin-center"
        >
          <AnimatedRoutes
            user={user}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onOpenProfile={() => setIsProfileOpen(true)}
            onEditProfile={() => setIsEditProfileOpen(true)}
            onUserUpdate={setUser}
            accountMode={accountMode}
            onAccountModeChange={setAccountMode}
          />
        </motion.div>
        <AnimatePresence>
          {isProfileOpen && <ProfileDetailsModal user={user} onClose={() => setIsProfileOpen(false)} />}
          {isEditProfileOpen && (
            <EditProfileModal
              user={user}
              onClose={() => setIsEditProfileOpen(false)}
              onUserUpdate={setUser}
            />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
