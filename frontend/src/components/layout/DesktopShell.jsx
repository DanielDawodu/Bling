import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/WorkspaceContext';
import FileTreeNav from './FileTreeNav';
import WorkspaceTabs from './WorkspaceTabs';
import RightDock from './RightDock';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';

export default function DesktopShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const { openTab, setActiveTab, tabs } = useTabs();

  // Ctrl+K global shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Sequence keyboard shortcuts (G A, A P, N P, N S, N A)
  useEffect(() => {
    let lastKey = '';
    let lastTime = 0;

    const onKey = (e) => {
      // Ignore if modifiers are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore sequences if inside input/textarea/editable fields
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      )) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (now - lastTime < 1000) {
        const seq = lastKey + key;
        if (seq === 'ga') {
          e.preventDefault();
          const item = { id: 'bling-ai', label: 'bling-ai/', path: '/bling-ai', icon: '⬡', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/bling-ai');
          lastKey = '';
          return;
        }
        if (seq === 'ap') {
          e.preventDefault();
          const item = { id: 'bling-ai', label: 'bling-ai/', path: '/bling-ai', icon: '⬡', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/bling-ai', { state: { prefill: 'audit my profile' } });
          lastKey = '';
          return;
        }
        if (seq === 'np') {
          e.preventDefault();
          const item = { id: 'create-post', label: 'new-post.md', path: '/create-post', icon: '+', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/create-post');
          lastKey = '';
          return;
        }
        if (seq === 'ns') {
          e.preventDefault();
          const item = { id: 'create-snippet', label: 'new-snippet.js', path: '/create-snippet', icon: '+', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/create-snippet');
          lastKey = '';
          return;
        }
        if (seq === 'na') {
          e.preventDefault();
          const item = { id: 'create-article', label: 'new-article.md', path: '/create-article', icon: '+', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/create-article');
          lastKey = '';
          return;
        }
        if (seq === 'gt') {
          e.preventDefault();
          const item = { id: 'settings', label: 'settings/', path: '/settings', icon: '▸', closable: true };
          const existingTab = tabs.find(t => t.id === item.id);
          if (existingTab) setActiveTab(item.id);
          else openTab(item);
          navigate('/settings');
          lastKey = '';
          return;
        }
      }

      lastKey = key;
      lastTime = now;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabs, openTab, setActiveTab, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--color-bg-base)',
      }}
    >
      {/* Main area: sidebar + workspace + dock */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left file tree ── */}
        <FileTreeNav />

        {/* ── Centre workspace ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <WorkspaceTabs />

          {/* Page content */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg-surface)' }}>
            <Outlet />
          </main>
        </div>

        {/* ── Right dock ── */}
        <RightDock />
      </div>

      {/* ── Status bar ── */}
      <StatusBar onOpenPalette={() => setPaletteOpen(true)} />

      {/* ── Command Palette ── */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
