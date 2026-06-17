import { Routes, Route, Navigate, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import LandingFooter from './components/landing/LandingFooter';

// Lazy-load all pages for faster initial load
const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Clips = lazy(() => import('./pages/Clips'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Minimal inline spinner for page transitions */
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shuls_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Sync logout across all open tabs via storage event
  useEffect(() => {
    function onStorageChange(e) {
      if (e.key === 'shuls_token' && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    }
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('shuls_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching user:', e);
    }
    setLoading(false);
  }

  function handleAuth(newToken) {
    localStorage.setItem('shuls_token', newToken);
    setToken(newToken);
  }

  async function handleLogout() {
    // Invalidate token on backend
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}

    // Clear local state
    localStorage.removeItem('shuls_token');
    setToken(null);
    setUser(null);

    // Notify extension to logout too
    try {
      if (window.chrome?.runtime?.sendMessage) {
        // Try to send to extension if it exists
        const extId = localStorage.getItem('shuls_ext_id');
        if (extId) {
          window.chrome.runtime.sendMessage(extId, { type: 'LOGOUT' });
        }
      }
    } catch (e) {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-muted-foreground text-xs tracking-wider">CARGANDO</span>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public landing pages — no dashboard shell */}
        <Route path="/" element={
          <LandingPage user={user} />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : (
            <div className="min-h-screen bg-background relative">
              <div className="bg-glow-bottom" />
              <div className="bg-grid" />
              <div className="bg-noise" />
              <div className="relative z-10">
                <Login />
              </div>
            </div>
          )
        } />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/auth/callback" element={
          <AuthCallback onAuth={handleAuth} />
        } />

        {/* Authenticated dashboard routes — with Navbar/Footer shell */}
        <Route element={user ? <DashboardShell user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard user={user} token={token} onUpdate={fetchUser} />
            </Suspense>
          } />
          <Route path="/rewards" element={
            <Suspense fallback={<PageLoader />}>
              <Rewards user={user} token={token} onUpdate={fetchUser} />
            </Suspense>
          } />
          <Route path="/leaderboard" element={
            <Suspense fallback={<PageLoader />}>
              <Leaderboard />
            </Suspense>
          } />
          <Route path="/challenges" element={
            <Suspense fallback={<PageLoader />}>
              <Challenges user={user} token={token} onUpdate={fetchUser} />
            </Suspense>
          } />
          <Route path="/clips" element={
            <Suspense fallback={<PageLoader />}>
              <Clips user={user} token={token} onUpdate={fetchUser} />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader />}>
              <Profile user={user} token={token} onUpdate={fetchUser} />
            </Suspense>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

/** Wrapper that provides the dashboard background, navbar, and footer */
function DashboardShell({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="bg-glow-bottom" />
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-noise" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex-1">
          {children || <Outlet />}
        </div>
        <LandingFooter />
      </div>
    </div>
  );
}

export default App;
