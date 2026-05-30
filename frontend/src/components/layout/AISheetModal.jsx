import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../utils/api';

export default function AISheetModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hey dev! I\'m Bling AI. What\'s up?' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || busy) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setBusy(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const resp = await aiAPI.chat(msg, history);
      setMessages(prev => [...prev, { role: 'model', text: resp.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.response?.data?.error || 'AI unavailable'}` }]);
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,.6)', zIndex: 100 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '85vh',
          background: 'var(--color-bg-elevated)',
          borderTop: '1px solid var(--color-border-strong)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className="fade-in"
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border-strong)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>✦</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Bling AI
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem', padding: '4px 8px' }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: m.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-surface)',
                border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '10px 14px',
                fontSize: 'var(--text-sm)',
                color: m.role === 'user' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px 12px 12px 4px',
              padding: '10px 14px',
            }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={send}
          style={{
            display: 'flex',
            gap: 10,
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={busy}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              color: 'white',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              opacity: (busy || !input.trim()) ? 0.5 : 1,
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
