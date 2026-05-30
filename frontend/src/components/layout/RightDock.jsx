import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI, aiAPI } from '../../utils/api';
import { useAuth } from '../../context/auth-context';

// ── Trending topics bar graph ──────────────────────────────────────────────────
const TRENDING = [
  { tag: '#typescript',   count: 142, color: '#7c6fef' },
  { tag: '#ai-tools',     count: 118, color: '#1D9B8E' },
  { tag: '#buildinpublic',count:  97, color: '#f59e0b' },
  { tag: '#react',        count:  84, color: '#60a5fa' },
  { tag: '#opensource',   count:  61, color: '#4ade80' },
  { tag: '#webdev',       count:  45, color: '#f87171' },
];

function TrendingGraph() {
  const max = TRENDING[0].count;
  return (
    <div style={{ padding: '0 4px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: 10, letterSpacing: '0.08em' }}>
        TRENDING
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TRENDING.map(({ tag, count, color }) => (
          <div key={tag}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color }}>
                {tag}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                {count}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--color-bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(count / max) * 100}%`,
                  background: color,
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────
function NotificationsPanel() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationAPI.getNotifications({ limit: 8 })
      .then(r => setNotifs(r.data.notifications || []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  const typeIcon = { like: '♥', comment: '◎', follow: '◉', mention: '@', default: '◆' };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', padding: '0 4px', marginBottom: 6 }}>
        NOTIFICATIONS
      </p>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" /></div>}
        {!loading && notifs.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '0 4px' }}>
            No notifications.
          </p>
        )}
        {notifs.map(n => (
          <div
            key={n._id}
            style={{
              padding: '6px 4px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              opacity: n.read ? 0.5 : 1,
            }}
          >
            <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', marginTop: 1 }}>
              {typeIcon[n.type] || typeIcon.default}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {n.message}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', margin: 0, marginTop: 2 }}>
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
            {!n.read && (
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Terminal ───────────────────────────────────────────────────────────────
function AITerminal() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('bling_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [{ role: 'model', text: '// bling ai ready. what are you building?' }];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [statusText, setStatusText] = useState('');
  const endRef = useRef(null);

  // Sync messages from local storage periodically in case they update in the main AI tab
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('bling_chat_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom events when history updates in same tab
    window.addEventListener('bling:chat-sync', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bling:chat-sync', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, busy, isExpanded]);

  const send = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setStatusText('');

    const newUserMsg = { role: 'user', text: msg };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    localStorage.setItem('bling_chat_history', JSON.stringify(updatedMessages));
    window.dispatchEvent(new CustomEvent('bling:chat-sync'));
    setBusy(true);

    const history = updatedMessages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));

    let success = false;
    while (!success) {
      try {
        const resp = await aiAPI.chat(msg, history);
        const newModelMsg = { role: 'model', text: resp.data.reply };
        const finalMessages = [...updatedMessages, newModelMsg];
        setMessages(finalMessages);
        localStorage.setItem('bling_chat_history', JSON.stringify(finalMessages));
        window.dispatchEvent(new CustomEvent('bling:chat-sync'));
        setStatusText('');
        success = true;
      } catch (err) {
        setStatusText('// reconnecting...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    setBusy(false);
  };

  const visibleMessages = messages.slice(-5);

  if (!isExpanded) {
    return (
      <div 
        style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-base)', padding: '4px' }}
        onClick={() => setIsExpanded(true)}
      >
        <form onSubmit={send} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#7c6fef', padding: '6px 8px', flexShrink: 0, cursor: 'pointer' }}>
            ⬡
          </span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="ask bling ai..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-primary)',
              padding: '6px 0',
            }}
          />
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '220px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
      <div 
        onClick={() => setIsExpanded(false)}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', padding: '4px 8px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', cursor: 'pointer', selectNone: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#7c6fef' }}>⬡</span>
          BLING AI TERMINAL
        </div>
        <span>▼</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visibleMessages.map((m, i) => (
          <pre
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: m.role === 'user' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {m.role === 'user' ? `⬡ ${m.text}` : m.text}
          </pre>
        ))}
        {statusText && (
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#3a3a5a', margin: 0 }}>
            {statusText}
          </pre>
        )}
        {busy && !statusText && (
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            ⬡ <span className="blink">█</span>
          </pre>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#7c6fef', padding: '6px 8px', flexShrink: 0 }}>
          ⬡
        </span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={busy}
          placeholder="ask bling ai..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-primary)',
            padding: '6px 0',
          }}
        />
      </form>
    </div>
  );
}

// ── RightDock ─────────────────────────────────────────────────────────────────
export default function RightDock() {
  const { user } = useAuth();

  return (
    <aside
      style={{
        width: 'var(--dock-w)',
        minWidth: 'var(--dock-w)',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-bg-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
        DOCK
      </div>

      {/* Scrollable upper area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {user && <TrendingGraph />}
        <NotificationsPanel />
      </div>

      {/* AI Terminal pinned to bottom */}
      <AITerminal />
    </aside>
  );
}
