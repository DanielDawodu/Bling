import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/WorkspaceContext';

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

function getExt(label) {
  const dot = label.lastIndexOf('.');
  if (dot === -1) return null;
  return label.slice(dot + 1);
}

export default function WorkspaceTabs() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();
  const navigate = useNavigate();

  const handleClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <div
      style={{
        height: 'var(--tab-h)',
        minHeight: 'var(--tab-h)',
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--color-bg-base)',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const ext = getExt(tab.label);
        const dotColor = ext ? (extColor[ext] || extColor.default) : extColor.default;

        return (
          <button
            key={tab.id}
            onClick={() => handleClick(tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              background: isActive ? 'var(--color-bg-surface)' : 'transparent',
              borderBottom: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
              borderRight: '1px solid var(--color-border)',
              borderTop: 'none',
              borderLeft: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background .1s ease, color .1s ease',
              outline: 'none',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-elevated)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            {ext && (
              <span style={{ color: dotColor, fontSize: '0.55rem' }}>●</span>
            )}
            <span>{tab.label}</span>
            {tab.closable && (
              <span
                role="button"
                tabIndex={-1}
                onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                style={{
                  marginLeft: 4,
                  color: 'var(--color-text-muted)',
                  fontSize: '0.65rem',
                  lineHeight: 1,
                  padding: '2px 3px',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                ×
              </span>
            )}
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1, borderBottom: '1px solid transparent' }} />
    </div>
  );
}
