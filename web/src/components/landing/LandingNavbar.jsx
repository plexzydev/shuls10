import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function LandingNavbar({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('shuls_token');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollLinks = [
    { href: 'inicio', label: 'Inicio' },
    { href: 'features', label: 'Características' },
    { href: 'extension', label: 'Extensión' },
  ];

  const pageLinks = [
    { to: '/about', label: 'Sobre nosotros' },
    { to: '/faq', label: 'FAQ' },
    { to: '/terms', label: 'Términos' },
  ];

  function handleScrollClick(e, href) {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${href}`);
      setTimeout(() => {
        const el = document.getElementById(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-4 sm:pt-5">
        <div
          className="max-w-[1100px] mx-auto rounded-full transition-all duration-500 border"
          style={{
            backgroundColor: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
            borderColor: scrolled ? 'rgba(34,197,94,0.15)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo — SHULS. with green dot */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <span className="font-heading font-black text-lg text-foreground tracking-tight transition-colors duration-300">
                SHULS
                <span className="text-brand">.</span>
              </span>
            </Link>

            {/* Center nav - Desktop */}
            <div className="hidden lg:flex items-center gap-1 bg-surface-100/50 rounded-full p-1 border border-brand/5 backdrop-blur-md">
              {scrollLinks.map(link => (
                <a
                  key={link.href}
                  href={`/#${link.href}`}
                  onClick={(e) => handleScrollClick(e, link.href)}
                  className="relative px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-300 rounded-full hover:bg-brand/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] group"
                >
                  {link.label}
                  <div className="absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </a>
              ))}
              <div className="w-px h-4 bg-brand/20 mx-1" />
              {pageLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 text-xs font-bold transition-all duration-300 rounded-full group ${location.pathname === link.to ? 'text-brand bg-brand/10' : 'text-muted-foreground hover:text-foreground hover:bg-brand/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'}`}
                >
                  {link.label}
                  <div className={`absolute inset-x-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-brand to-transparent transition-opacity duration-300 ${location.pathname === link.to ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 p-1 pr-5 text-brand text-xs font-bold hover:bg-brand/20 hover:scale-105 transition-all duration-300 tracking-wider shadow-lg shadow-brand/5 group"
                >
                  {user.avatar ? (
                    <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-brand/30 group-hover:border-brand/60 transition-colors" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black">
                      {(user.displayName || user.kickUsername || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  Dashboard
                </Link>
              ) : isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-brand/10 border border-brand/20 px-6 py-2.5 text-brand text-xs font-bold hover:bg-brand/20 hover:scale-105 transition-all duration-300 tracking-wider shadow-lg shadow-brand/5"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex rounded-full bg-brand px-7 py-2.5 text-black text-xs font-bold hover:bg-brand-light hover:scale-105 transition-all duration-300 tracking-wider shadow-lg shadow-brand/20"
                >
                  Iniciar sesión
                </Link>
              )}

              {/* Mobile hamburger */}
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-20 left-3 right-3 bg-card border border-brand/15 rounded-3xl shadow-2xl shadow-black/50 p-4 animate-fade-in-down">
            {/* Scroll links */}
            <div className="space-y-1 mb-3">
              {scrollLinks.map(link => (
                <a
                  key={link.href}
                  href={`/#${link.href}`}
                  onClick={(e) => handleScrollClick(e, link.href)}
                  className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-brand/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="h-px bg-brand/10 mb-3" />

            {/* Page links */}
            <div className="space-y-1 mb-4">
              {pageLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-brand/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="h-px bg-brand/10 mb-3" />

            {/* Login / Dashboard button */}
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-bold tracking-wider shadow-lg shadow-brand/5 transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs">
                    {(user.displayName || user.kickUsername || 'S')[0].toUpperCase()}
                  </div>
                )}
                Ir al Dashboard
              </Link>
            ) : isLoggedIn ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-bold tracking-wider shadow-lg shadow-brand/5 transition-all"
              >
                <LayoutDashboard size={16} /> Ir al Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-brand text-black text-sm font-bold tracking-wider shadow-lg shadow-brand/20 transition-all hover:bg-brand-light"
              >
                Iniciar sesión <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
