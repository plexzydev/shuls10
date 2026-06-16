import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import Rewards from './pages/Rewards';
import Leaderboard from './pages/Leaderboard';
import Challenges from './pages/Challenges';
import Clips from './pages/Clips';
import Profile from './pages/Profile';
import AuthCallback from './pages/AuthCallback';
import Navbar from './components/Navbar';
import LandingFooter from './components/landing/LandingFooter';

export const API_URL = 'http://localhost:3001';

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
      <Route path="/dashboard" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Dashboard user={user} token={token} onUpdate={fetchUser} />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="/rewards" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Rewards user={user} token={token} onUpdate={fetchUser} />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="/leaderboard" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Leaderboard />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="/challenges" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Challenges user={user} token={token} onUpdate={fetchUser} />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="/clips" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Clips user={user} token={token} onUpdate={fetchUser} />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="/profile" element={
        user ? (
          <DashboardShell user={user} onLogout={handleLogout}>
            <Profile user={user} token={token} onUpdate={fetchUser} />
          </DashboardShell>
        ) : <Navigate to="/login" />
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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
          {children}
        </div>
        <LandingFooter />
      </div>
    </div>
  );
}

export default App;
