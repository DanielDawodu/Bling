import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabs } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/auth-context';

// ─── Tree node definitions ────────────────────────────────────────────────────
const EXPLORER_TREE = [
  {
    group: 'WORKSPACE',
    items: [
      { id: 'feed',     label: 'feed.live',    path: '/',           icon: '◉', ext: 'live'  },
      { id: 'snippets', label: 'snippets/',    path: '/snippets',   icon: '◈', ext: 'dir'   },
      { id: 'jobs',     label: 'jobs.board',   path: '/jobs',       icon: '◆', ext: 'board' },
    ]
  },
  {
    group: 'PERSONAL',
    items: [
      { id: 'create-post',    label: 'new-post.md',    path: '/create-post',    icon: '+', ext: 'md'  },
      { id: 'create-article', label: 'new-article.md', path: '/create-article', icon: '+', ext: 'md'  },
      { id: 'create-snippet', label: 'new-snippet.js', path: '/create-snippet', icon: '+', ext: 'js'  },
      { id: 'create-job',     label: 'new-job.json',   path: '/create-job',     icon: '+', ext: 'json'},
    ]
  },
  {
    group: 'PROFILE',
    items: [
      { id: 'profile',        label: 'profile/',       path: null,              icon: '▸', ext: 'dir', dynamic: true },
      { id: 'settings',       label: 'settings/',      path: '/settings',       icon: '▸', ext: 'dir' },
      { id: 'notifications',  label: 'notifications',  path: '/notifications',  icon: '◎', ext: 'log' },
      { id: 'messages',       label: 'messages/',      path: '/messages',       icon: '◐', ext: 'dir' },
    ]
  },
];

const extColor = {
  live:  '#7c6fef',
  dir:   '#fbbf24',
  board: '#4ade80',
  md:    '#60a5fa',
  js:    '#fbbf24',
  json:  '#f87171',
  log:   '#f87171',
  default: '#8888a8',
};

export default function FileTreeNav() {
  const { activeTab, setActiveTab, openTab, tabs } = useTabs();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (item) => {
    const path = item.dynamic ? `/profile/${user?.id || user?._id}` : item.path;
    if (!path) return;

    const existingTab = tabs.find(t => t.id === item.id);
    if (existingTab) {
      setActiveTab(item.id);
    } else {
      openTab({ id: item.id, label: item.label, path, icon: item.icon, closable: item.id.startsWith('create') });
    }
    navigate(path);
  };

  return (
    <aside
      style={{ width: 'var(--explorer-w)', minWidth: 'var(--explorer-w)', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}
      className="flex flex-col h-full overflow-hidden select-none"
    >
      {/* Explorer header */}
      <div
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-muted)', padding: '10px 12px 6px', letterSpacing: '0.08em', borderBottom: '1px solid var(--color-border)' }}
      >
        EXPLORER
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {EXPLORER_TREE.map(section => (
          <div key={section.group} className="mb-2">
            <div
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', padding: '8px 12px 4px', letterSpacing: '0.1em' }}
            >
              {section.group}
            </div>
            {section.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px 4px 10px',
                    background: isActive ? 'var(--color-accent-muted)' : 'transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background .1s ease, border-left-color .1s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: extColor[item.ext] || extColor.default, fontSize: '0.6rem', minWidth: 10 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.ext && item.ext !== 'dir' && (
                    <span style={{ marginLeft: 'auto', color: extColor[item.ext] || extColor.default, fontSize: '0.55rem', opacity: 0.6 }}>
                      .{item.ext}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom user chip */}
      {user && (
        <button
          onClick={() => navigate(`/profile/${user?.id || user?._id}`)}
          style={{
            borderTop: '1px solid var(--color-border)',
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
            padding: '8px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Go to your profile"
        >
          <span style={{ color: 'var(--color-success)', fontSize: '0.55rem' }}>●</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{user.username}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.55rem' }}>↗</span>
        </button>
      )}
    </aside>
  );
}
