import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState('');

  const { login, loginVerify2FA, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData);
    if (result.success) {
      if (result.requireTwoFactor) {
        setRequire2FA(true);
        setUserId(result.userId);
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginVerify2FA(userId, twoFactorToken);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await resendVerification(formData.email);
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)',
        padding: '24px',
        color: 'var(--color-text-primary)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 8,
          padding: '32px 24px',
        }}
        className="fade-in"
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', color: 'var(--color-accent)', fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 6px' }}>
            BLING 2.0
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            The developer's second brain
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid var(--color-error)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-error)',
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            {error}
            {error.includes('verify your email') && (
              <button
                onClick={handleResendEmail}
                style={{
                  marginLeft: 8,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'inherit',
                  cursor: 'pointer',
                  padding: 0
                }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend link'}
              </button>
            )}
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-success)',
              marginBottom: 16,
            }}
          >
            {success}
          </div>
        )}

        {!require2FA ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="developer@bling.live"
                style={{
                  width: '100%',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', textDecoration: 'none' }}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '11px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
                marginTop: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                2FA CODE
              </label>
              <input
                type="text"
                value={twoFactorToken}
                onChange={e => setTwoFactorToken(e.target.value)}
                required
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                style={{
                  width: '100%',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '11px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
            </button>

            <button
              type="button"
              onClick={() => setRequire2FA(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
            OAUTH PARTNERS
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/api/auth/github" className="oauth-btn oauth-btn-github">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </a>

          <a href="/api/auth/google" className="oauth-btn oauth-btn-google">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </a>

          {/* SynkID OAuth Button - Styled identically, visually live, does not route / log anywhere yet */}
          <button
            type="button"
            className="oauth-btn oauth-btn-synkid"
            onClick={() => {}}
            style={{
              outline: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z" fill="var(--color-accent)" />
            </svg>
            Continue with SynkID
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
