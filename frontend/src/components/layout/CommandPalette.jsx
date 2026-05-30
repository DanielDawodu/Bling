import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/auth-context';
import { searchAPI } from '../../utils/api';

// ─── Static commands ────────────────────────────────────────────────────────
const STATIC_COMMANDS = [
  { id: 'go-feed',     label: 'Go to feed.live',     icon: '◉', path: '/',              tabId: 'feed'           },
  { id: 'go-snippets', label: 'Go to snippets/',      icon: '◈', path: '/snippets',      tabId: 'snippets'       },
  { id: 'go-jobs',     label: 'Go to jobs.board',     icon: '◆', path: '/jobs',          tabId: 'jobs'           },
  { id: 'go-notifs',   label: 'Go to notifications',  icon: '◎', path: '/notifications', tabId: 'notifications'  },
  { id: 'go-msgs',     label: 'Go to messages',        icon: '◐', path: '/messages',      tabId: 'messages'       },
  { id: 'np',          label: 'New post  [N P]',       icon: '+', path: '/create-post',   tabId: 'create-post'    },
  { id: 'na',          label: 'New article  [N A]',    icon: '+', path: '/create-article', tabId: 'create-article' },
  { id: 'ns',          label: 'Share a snippet  [N S]',icon: '+', path: '/create-snippet',tabId: 'create-snippet' },
  { id: 'ga',          label: 'Ask Bling AI  [G A]',   icon: '⬡', action: 'open-ai'                               },
  { id: 'ap',          label: 'Audit my profile  [A P]',icon:'✦', action: 'audit'                                 },
  { id: 'go-profile',  label: 'Go to profile',       icon: '◎', tabId: 'profile',       dynamic: true           },
  { id: 'go-settings', label: 'Open settings  [G T]',  icon: '⚙', path: '/settings',      tabId: 'settings'       },
  { id: 'logout',      label: 'Log out',               icon: '⎋', action: 'logout'                                },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { openTab, setActiveTab, tabs } = useTabs();
  const { logout, user } = useAuth();

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Live search backend on query change (debounced)
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const r = await searchAPI.globalSearch(query);
        const results = [];
        (r.data.users || []).slice(0, 3).forEach(u => results.push({
          id: `user-${u._id}`, label: `@${u.username}`, icon: '◉', path: `/profile/${u._id}`, tabId: `profile-${u._id}`, tabLabel: `${u.username}/`
        }));
        (r.data.posts || []).slice(0, 3).forEach(p => results.push({
          id: `post-${p._id}`, label: p.title, icon: '◆', path: `/post/${p._id}`, tabId: `post-${p._id}`, tabLabel: p.title.slice(0, 20)
        }));
        (r.data.snippets || []).slice(0, 2).forEach(s => results.push({
          id: `snip-${s._id}`, label: s.title, icon: '◈', path: `/snippets/${s._id}`, tabId: `snippet-${s._id}`, tabLabel: s.title.slice(0, 20)
        }));
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredStatic = query.trim()
    ? STATIC_COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : STATIC_COMMANDS;

  const allItems = [...searchResults, ...filteredStatic];

  const execute = useCallback(async (item) => {
    onClose();
    if (item.action === 'logout') { await logout(); navigate('/login'); return; }
    if (item.action === 'open-ai') {
      const tabItem = { id: 'bling-ai', label: 'bling-ai/', path: '/bling-ai', icon: '⬡', closable: true };
      const existingTab = tabs.find(t => t.id === tabItem.id);
      if (existingTab) setActiveTab(tabItem.id);
      else openTab(tabItem);
      navigate('/bling-ai');
      return;
    }
    if (item.action === 'audit') {
      const tabItem = { id: 'bling-ai', label: 'bling-ai/', path: '/bling-ai', icon: '⬡', closable: true };
      const existingTab = tabs.find(t => t.id === tabItem.id);
      if (existingTab) setActiveTab(tabItem.id);
      else openTab(tabItem);
      navigate('/bling-ai', { state: { prefill: 'audit my profile' } });
      return;
    }
    const path = item.dynamic ? `/profile/${user?.id || user?._id}` : item.path;
    if (path) {
      navigate(path);
      const existingTab = tabs.find(t => t.id === item.tabId);
      if (existingTab) setActiveTab(item.tabId);
      else openTab({ id: item.tabId, label: item.tabLabel || item.label, path, icon: item.icon, closable: !['feed','snippets','jobs'].includes(item.tabId) });
    }
  }, [navigate, openTab, setActiveTab, tabs, logout, onClose, user]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { if (allItems[selected]) execute(allItems[selected]); }
      if (e.key === 'Escape')    { onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, allItems, selected, execute, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,.7)', backdropFilter: 'blur(4px)', zIndex: 200 }}
      />

      {/* Palette panel */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxWidth: '92vw',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 8,
          boxShadow: '0 24px 48px rgba(0,0,0,.7)',
          zIndex: 201,
          overflow: 'hidden',
        }}
        className="fade-in"
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Type a command or search..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
            }}
          />
          {searching && <div className="spinner" style={{ width: 14, height: 14 }} />}
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '4px 0' }}>
          {searchResults.length > 0 && (
            <div style={{ padding: '4px 16px 2px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
              SEARCH RESULTS
            </div>
          )}
          {allItems.map((item, i) => {
            if (i === searchResults.length && i > 0) {
              // Add separator before commands
              return (
                <React.Fragment key={item.id}>
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                  <div style={{ padding: '4px 16px 2px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                    COMMANDS
                  </div>
                  <PaletteItem item={item} isSelected={i === selected} onClick={() => execute(item)} />
                </React.Fragment>
              );
            }
            return <PaletteItem key={item.id} item={item} isSelected={i === selected} onClick={() => execute(item)} />;
          })}
          {allItems.length === 0 && (
            <p style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              No results found.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function PaletteItem({ item, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        background: isSelected ? 'var(--color-accent-muted)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        textAlign: 'left',
      }}
    >
      <span style={{ color: 'var(--color-accent)', fontSize: '0.6rem', minWidth: 12 }}>{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}
