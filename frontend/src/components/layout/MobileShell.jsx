import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AISheetModal from './AISheetModal';
import { useAuth } from '../../context/auth-context';
import { useNotifications } from '../../context/NotificationContext';
import { messageAPI, normalizeUrl } from '../../utils/api';

/* ─── Bottom nav config ────────────────────────────────── */
const NAV_ITEMS = [
  {
    id: 'feed', label: 'Feed', path: '/',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'snippets', label: 'Code', path: '/snippets',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'jobs', label: 'Jobs', path: '/jobs',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: 'ai', label: 'AI', action: 'ai',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'messages', label: 'Messages', path: '/messages',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

/* ─── SynkID hexagon badge ─────────────────────────────── */
function SynkIdBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(124,111,239,.15)',
      border: '1px solid rgba(124,111,239,.4)',
      borderRadius: 5, padding: '2px 7px',
      fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
      fontWeight: 600, color: '#7c6fef',
    }}>
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#7c6fef" strokeWidth="2">
        <path d="M12 2 L21.5 7.5 L21.5 16.5 L12 22 L2.5 16.5 L2.5 7.5 Z" />
      </svg>
      SynkID
    </span>
  );
}

/* ─── Divider ──────────────────────────────────────────── */
function DrawerDivider() {
  return <div style={{ height: 1, background: '#1c1c2e', margin: '6px 0' }} />;
}

/* ─── Drawer nav link ──────────────────────────────────── */
function DrawerLink({ icon, label, badge, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '13px 20px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: danger ? '#e24b4a' : 'var(--color-text-primary)',
        fontSize: '0.92rem', fontFamily: 'var(--font-sans)',
        textAlign: 'left', position: 'relative',
        transition: 'background 0.15s',
        borderRadius: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ fontSize: '1.1rem', opacity: danger ? 1 : 0.7 }}>{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span style={{
          marginLeft: 'auto', minWidth: 18, height: 18,
          background: '#7c6fef', borderRadius: 9,
          fontSize: '0.62rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', padding: '0 4px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

/* ─── Main MobileShell ─────────────────────────────────── */
export default function MobileShell() {
  const [aiOpen, setAiOpen]         = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dmUnread, setDmUnread]     = useState(0);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount: notifUnread } = useNotifications();

  // Touch swipe state
  const touchStartX = useRef(null);

  /* ── AI event bridge ─────────────────────────── */
  useEffect(() => {
    const open = () => setAiOpen(true);
    window.addEventListener('open-bling-ai', open);
    return () => window.removeEventListener('open-bling-ai', open);
  }, []);

  /* ── DM unread count ─────────────────────────── */
  useEffect(() => {
    let timer;
    const poll = async () => {
      try {
        const res = await messageAPI.getUnreadCount();
        setDmUnread(res.data.count || 0);
      } catch { /* silent */ }
    };
    poll();
    timer = setInterval(poll, 15000);
    return () => clearInterval(timer);
  }, []);

  /* ── Close drawer on route change ───────────── */
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  /* ── Touch swipe left on overlay to close ────── */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50) setDrawerOpen(false); // swiped left ≥50px
    touchStartX.current = null;
  };

  /* ── Nav handler ─────────────────────────────── */
  const handleNav = (item) => {
    if (item.action === 'ai') { setAiOpen(true); return; }
    if (item.path) navigate(item.path);
  };

  const activeId = NAV_ITEMS.find(n => n.path && (
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  ))?.id;

  /* ── Drawer nav ──────────────────────────────── */
  const goTo = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };
  const handleLogout = async () => {
    setDrawerOpen(false);
    try { await logout(); } catch {}
    navigate('/login');
  };

  const avatarUrl = user?.avatar ? normalizeUrl(user.avatar) : null;
  const displayName = user?.displayName || user?.username || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden', background: 'var(--color-bg-base)' }}>

      {/* ── Mobile header ───────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 48, flexShrink: 0,
        background: 'var(--color-bg-base)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {/* BLING wordmark — sidebar trigger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
            fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
            color: '#7c6fef', fontWeight: 700, letterSpacing: '0.08em',
            transition: 'opacity 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => e.currentTarget.style.opacity = '.7'}
          onMouseUp={e => e.currentTarget.style.opacity = '1'}
          onTouchStart={e => e.currentTarget.style.opacity = '.7'}
          onTouchEnd={e => e.currentTarget.style.opacity = '1'}
        >
          BLING
        </button>

        {/* Right side: search icon + notification bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Search icon → /search */}
          <button
            onClick={() => navigate('/search')}
            aria-label="Search"
            style={iconBtnStyle}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => navigate('/notifications')}
            aria-label={`Notifications${notifUnread > 0 ? ` (${notifUnread} unread)` : ''}`}
            style={{ ...iconBtnStyle, position: 'relative' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {notifUnread > 0 && (
              <span style={badgeStyle}>{notifUnread > 99 ? '99+' : notifUnread}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Page content ────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg-surface)' }}>
        <Outlet />
      </main>

      {/* ── Bottom nav ──────────────────────────── */}
      <nav style={{
        display: 'flex', height: 58,
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                borderTop: isActive ? '2px solid #7c6fef' : '2px solid transparent',
                color: isActive ? '#7c6fef' : 'var(--color-text-muted)',
                transition: 'color .15s ease',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
              }}
            >
              <span style={{ position: 'relative' }}>
                <item.Icon />
                {item.id === 'messages' && dmUnread > 0 && (
                  <span style={{ ...badgeStyle, top: -4, right: -6 }}>
                    {dmUnread > 99 ? '99+' : dmUnread}
                  </span>
                )}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.04em' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Sidebar drawer overlay ───────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 200,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* ── Sidebar drawer ──────────────────────── */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 'min(80vw, 300px)',
          background: '#0d0d18',
          borderRight: '0.5px solid #1c1c2e',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: drawerOpen ? 'transform 0.2s ease' : 'transform 0.15s ease',
          willChange: 'transform',
        }}
      >
        {/* User card */}
        <div style={{ padding: '28px 20px 16px' }}>
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', marginBottom: 10, border: '2px solid #7c6fef' }}
            />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', marginBottom: 10,
              background: 'linear-gradient(135deg, #7c6fef, #5a4fd6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: '#fff',
              border: '2px solid #7c6fef',
            }}>
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          {/* Name + handle */}
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
            {displayName}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            @{user?.username}
          </div>
          {/* SynkID badge */}
          <SynkIdBadge />
        </div>

        <DrawerDivider />

        {/* Nav links */}
        <div style={{ flex: 1, padding: '6px 8px' }}>
          <DrawerLink icon="👤" label="Profile"       onClick={() => goTo(`/profile/${user?.id || user?._id}`)} />
          <DrawerLink icon="🔔" label="Notifications" badge={notifUnread} onClick={() => goTo('/notifications')} />
          <DrawerLink icon="📝" label="Articles"      onClick={() => goTo('/search?type=article')} />
          <DrawerLink icon="🔖" label="Bookmarks"     onClick={() => goTo('/search')} />
          <DrawerLink icon="⚙️" label="Settings"      onClick={() => goTo('/settings')} />
        </div>

        <DrawerDivider />

        {/* Logout */}
        <div style={{ padding: '6px 8px 24px' }}>
          <DrawerLink icon="↩" label="Log out" danger onClick={handleLogout} />
        </div>
      </aside>

      <AISheetModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

/* ─── Shared mini-styles ───────────────────────────────── */
const iconBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  padding: 8, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 0.15s, background 0.15s',
  WebkitTapHighlightColor: 'transparent',
};

const badgeStyle = {
  position: 'absolute', top: -5, right: -7,
  minWidth: 16, height: 16,
  background: '#7c6fef',
  borderRadius: 8,
  fontSize: '0.58rem', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', padding: '0 3px',
  border: '1.5px solid var(--color-bg-base)',
  pointerEvents: 'none',
};
