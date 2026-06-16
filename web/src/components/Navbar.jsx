import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Gift, Trophy, Target, Film, User, LogOut, ChevronDown, Menu, X, MoreHorizontal, Info, HelpCircle, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setMoreMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Scroll-triggered background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/rewards', label: 'Rewards', icon: <Gift size={15} /> },
    { to: '/challenges', label: 'Retos', icon: <Target size={15} /> },
    { to: '/clips', label: 'Clips', icon: <Film size={15} /> },
    { to: '/leaderboard', label: 'Ranking', icon: <Trophy size={15} /> },
    { to: '/profile', label: 'Perfil', icon: <User size={15} /> },
  ];

  const moreItems = [
    { to: '/about', label: 'Sobre nosotros', icon: <Info size={14} /> },
    { to: '/faq', label: 'FAQ', icon: <HelpCircle size={14} /> },
    { to: '/terms', label: 'Términos', icon: <FileText size={14} /> },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4">
        <div
          className="max-w-[1100px] mx-auto rounded-full transition-all duration-500 border relative z-50"
          style={{
            backgroundColor: scrolled ? 'rgba(10,10,10,0.92)' : 'rgba(10,10,10,0.7)',
            borderColor: scrolled ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          <div className="px-3 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo — SHULS. with green dot */}
            <Link to="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
              <span className="font-heading font-black text-lg text-foreground tracking-tight transition-colors duration-300">
                SHULS
                <span className="text-brand">.</span>
              </span>
            </Link>

            {/* Center Nav - Desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-surface-100/50 rounded-full p-1 border border-brand/5 backdrop-blur-md">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-300 group ${
                    isActive(item.to)
                      ? 'text-brand bg-brand/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                  }`}
                >
                  <div className={`transition-transform duration-300 ${isActive(item.to) ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>
                  <span className="hidden xl:inline">{item.label}</span>
                  {isActive(item.to) && <div className="absolute inset-x-3 -bottom-1 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />}
                </Link>
              ))}

              <div className="w-px h-4 bg-brand/20 mx-1" />

              {/* More Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`relative flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold transition-all duration-300 group ${
                    moreMenuOpen || moreItems.some(i => isActive(i.to))
                      ? 'text-foreground bg-brand/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand/10'
                  }`}
                >
                  <MoreHorizontal size={16} />
                </button>
                {moreMenuOpen && (
                  <div className="absolute top-full right-0 mt-3 w-44 bg-card border border-brand/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in-down">
                    <div className="p-1">
                      {moreItems.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                            isActive(item.to) ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-brand/5'
                          }`}
                        >
                          {item.icon} {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* User Area - Desktop */}
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-brand/5 transition-all duration-300 group"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-brand/30 transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand/12 flex items-center justify-center text-xs font-bold text-brand">
                      {(user.displayName || user.kickUsername || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-foreground leading-none">{user.displayName || user.kickUsername}</p>
                    <p className="text-[10px] text-brand font-bold mt-0.5">{user.points?.toLocaleString() || 0} Orbes</p>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 hidden md:block ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-brand/15 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in-down">
                    <div className="p-3 border-b border-brand/10">
                      <p className="text-xs font-medium text-foreground">{user.displayName || user.kickUsername}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.kickUsername}</p>
                    </div>
                    <button
                      onClick={() => { onLogout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all duration-300"
                    >
                      <LogOut size={13} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-brand/5 transition-all text-muted-foreground hover:text-foreground"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-20 left-3 right-3 bg-card border border-brand/15 rounded-3xl shadow-2xl shadow-black/50 p-4 animate-fade-in-down">
            {/* Nav Items */}
            <div className="space-y-1 mb-4">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    isActive(item.to)
                      ? 'bg-brand/15 text-brand shadow-inner'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-brand/10 pt-4 mb-4">
              <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Más</p>
              <div className="space-y-1">
                {moreItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                      isActive(item.to) ? 'text-brand bg-brand/10' : 'text-muted-foreground hover:text-foreground hover:bg-brand/5'
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User section */}
            <div className="border-t border-brand/10 pt-4">
              <div className="flex items-center gap-3 px-4 mb-3">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-brand/30" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand/12 flex items-center justify-center text-xs font-bold text-brand">
                    {(user.displayName || user.kickUsername || 'S')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.displayName || user.kickUsername}</p>
                  <p className="text-[10px] text-brand font-bold">{user.points?.toLocaleString() || 0} Orbes</p>
                </div>
              </div>
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
