import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useTabs } from '../../context/WorkspaceContext';

export default function StatusBar({ onOpenPalette }) {
  const { user } = useAuth();
  const { activeTab, openTab, setActiveTab, tabs } = useTabs();
  const [statusText, setStatusText] = React.useState('connected');
  const navigate = useNavigate();

  const handleUsernameClick = () => {
    const item = { id: 'settings', label: 'settings/', path: '/settings', icon: '▸', closable: true };
    const existingTab = tabs.find(t => t.id === item.id);
    if (existingTab) setActiveTab(item.id);
    else openTab(item);
    navigate('/settings');
  };

  React.useEffect(() => {
    let timer;
    const handleStatus = (e) => {
      const msg = e.detail || 'connected';
      setStatusText(msg);
      if (msg !== 'connected') {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setStatusText('connected');
        }, 3000);
      }
    };
    window.addEventListener('bling:status', handleStatus);
    return () => {
      window.removeEventListener('bling:status', handleStatus);
      clearTimeout(timer);
    };
  }, []);

  const branchName = `bling/${activeTab || 'main'}`;

  return (
    <footer
      style={{
        height: 'var(--status-h)',
        minHeight: 'var(--status-h)',
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--color-text-inverse)',
        userSelect: 'none',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>BLING</span>
        <span style={{ opacity: 0.75 }}>⎇ {branchName}</span>
        <span style={{ opacity: 0.75 }}>⊛ {statusText}</span>
      </div>

      {/* Centre — click to open palette */}
      <button
        onClick={onOpenPalette}
        style={{
          background: 'rgba(0,0,0,.2)',
          border: 'none',
          borderRadius: 4,
          padding: '1px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--color-text-inverse)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>⌘K</span>
        <span style={{ opacity: 0.7 }}>Command Palette</span>
      </button>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user && (
          <>
            <span
              onClick={handleUsernameClick}
              style={{ opacity: 0.75, cursor: 'pointer', textDecoration: 'underline' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
            >
              @{user.username}
            </span>
            {user.isVerified && <span title="Verified">✦</span>}
          </>
        )}
        <span style={{ opacity: 0.6 }}>UTF-8</span>
        <span style={{ opacity: 0.6 }}>LF</span>
      </div>
    </footer>
  );
}
