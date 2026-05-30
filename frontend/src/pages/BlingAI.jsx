import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiAPI } from '../utils/api';
import SEO from '../components/SEO';

export default function BlingAI() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [statusText, setStatusText] = useState('');
  const logRef = useRef(null);

  // Sync messages from local storage when updated in terminal/other pages
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
    window.addEventListener('bling:chat-sync', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bling:chat-sync', handleStorageChange);
    };
  }, []);

  // Handle prefill from state (e.g. from command palette or post Ask AI button)
  useEffect(() => {
    if (location.state?.prefill) {
      setInput(location.state.prefill);
      // Clear location state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    logRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, statusText]);

  const send = async (e) => {
    if (e) e.preventDefault();
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

    try {
      const resp = await aiAPI.chat(msg, history);
      const newModelMsg = { role: 'model', text: resp.data.reply };
      const finalMessages = [...updatedMessages, newModelMsg];
      setMessages(finalMessages);
      localStorage.setItem('bling_chat_history', JSON.stringify(finalMessages));
      window.dispatchEvent(new CustomEvent('bling:chat-sync'));
    } catch (err) {
      // First failure: show thinking and retry once after 3 seconds
      setStatusText('// bling ai is thinking...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const resp = await aiAPI.chat(msg, history);
        const newModelMsg = { role: 'model', text: resp.data.reply };
        const finalMessages = [...updatedMessages, newModelMsg];
        setMessages(finalMessages);
        localStorage.setItem('bling_chat_history', JSON.stringify(finalMessages));
        window.dispatchEvent(new CustomEvent('bling:chat-sync'));
        setStatusText('');
      } catch (secondErr) {
        // Second failure: show unavailable message in special muted color
        const errorMsg = { role: 'model', text: '// bling ai is unavailable right now. try again shortly.', isError: true };
        const finalMessages = [...updatedMessages, errorMsg];
        setMessages(finalMessages);
        localStorage.setItem('bling_chat_history', JSON.stringify(finalMessages));
        window.dispatchEvent(new CustomEvent('bling:chat-sync'));
        setStatusText('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#080810',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-mono)',
      }}
      className="fade-in"
    >
      <SEO
        title="Bling AI"
        description="Ask Bling AI for coding help, audits, or community insights."
        url="/bling-ai"
      />

      {/* Top connected bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-base)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)' }}>
          <span style={{ color: '#7c6fef', fontSize: '1rem' }}>⬡</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>bling ai</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>connected</span>
        </div>
      </div>

      {/* Scrollable conversation area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <pre
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: m.role === 'user'
                ? '#7c6fef'
                : m.isError
                  ? '#3a3a5a'
                  : 'var(--color-text-primary)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            {m.role === 'user' ? `⬡ ${m.text}` : m.text}
          </pre>
        ))}

        {statusText && (
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            {statusText}
          </pre>
        )}

        {busy && !statusText && (
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            ⬡ <span className="blink">█</span>
          </pre>
        )}
        <div ref={logRef} />
      </div>

      {/* Input bar at the bottom */}
      <form
        onSubmit={send}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-base)',
          padding: '8px 12px',
        }}
      >
        <span style={{ fontSize: '1rem', color: '#7c6fef', padding: '0 8px', flexShrink: 0 }}>⬡</span>
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
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            padding: '8px 0',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          style={{
            background: 'transparent',
            border: 'none',
            color: (input.trim() && !busy) ? '#7c6fef' : '#3a3a5a',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            cursor: (input.trim() && !busy) ? 'pointer' : 'default',
            padding: '4px 12px',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
