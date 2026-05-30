import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import { useTheme } from '../context/ThemeContext';
import SessionList from '../components/SessionList';
import api from '../utils/api';
import './Settings.css';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme, toggleTheme, fontSize, setFontSize, codeFont, setCodeFont } = useTheme();

  const [activeSection, setActiveSection] = useState('account');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileDetailView, setMobileDetailView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (window.innerWidth <= 768) {
      setMobileDetailView(true);
    }
  };

  // Account State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 2FA Security State
  const [tfaStatus, setTfaStatus] = useState(user?.isTwoFactorEnabled || false);
  const [showTfaEnableModal, setShowTfaEnableModal] = useState(false);
  const [showTfaDisableModal, setShowTfaDisableModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [tfaError, setTfaError] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [justEnabledTfa, setJustEnabledTfa] = useState(false);

  // Notifications State
  const [notifSettings, setNotifSettings] = useState(
    user?.notificationSettings || {
      newFollowers: true,
      postLikes: true,
      comments: true,
      mentions: true,
      dms: true,
      jobApplications: true,
      blingAIUpdates: true,
    }
  );

  // Privacy State
  const [privacyPrefs, setPrivacyPrefs] = useState(
    user?.privacyPreferences || {
      visibility: 'public',
      dmPermission: 'everyone',
      showSynkId: true,
    }
  );

  // Developer State
  const [devMode, setDevMode] = useState(user?.developerMode || false);
  const [apiKey, setApiKey] = useState(user?.developerApiKey || '');
  const [webhookUrl, setWebhookUrl] = useState(user?.developerWebhookUrl || '');
  const [copiedKey, setCopiedKey] = useState(false);

  // Sync user state on load/change
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setTfaStatus(user.isTwoFactorEnabled || false);
      setDevMode(user.developerMode || false);
      setApiKey(user.developerApiKey || '');
      setWebhookUrl(user.developerWebhookUrl || '');
      if (user.notificationSettings) setNotifSettings(user.notificationSettings);
      if (user.privacyPreferences) setPrivacyPrefs(user.privacyPreferences);
    }
  }, [user]);

  // Fetch 2FA Backup codes if 2FA is active
  useEffect(() => {
    if (tfaStatus && activeSection === 'security') {
      fetchBackupCodes();
    }
  }, [tfaStatus, activeSection]);

  const fetchBackupCodes = async () => {
    try {
      const res = await api.get('/auth/2fa/backup-codes');
      setBackupCodes(res.data.backupCodes || []);
    } catch (e) {
      console.error('Error fetching backup codes:', e);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const res = await api.put(`/users/${user.id || user._id}/settings`, {
        displayName,
        email,
        developerMode: devMode,
      });
      updateUser(res.data.user);
      alert('Account settings saved successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update account settings');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    setUpdatingPassword(true);
    try {
      await api.put(`/users/${user.id || user._id}/password`, {
        currentPassword,
        newPassword,
      });
      alert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(`/users/${user.id || user._id}`);
      alert('Account deleted successfully.');
      logout();
      window.location.href = '/login';
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  // 2FA Actions
  const handleStartTfaSetup = async () => {
    setTfaError('');
    setTfaCode('');
    try {
      const res = await api.get('/auth/2fa/setup');
      setTfaSecret(res.data.secret);
      setQrCodeData(res.data.qrCode);
      setShowTfaEnableModal(true);
    } catch (err) {
      alert('Failed to initialize 2FA setup');
    }
  };

  const handleConfirmTfaEnable = async () => {
    setTfaError('');
    try {
      const res = await api.post('/auth/2fa/verify', { token: tfaCode });
      setBackupCodes(res.data.backupCodes || []);
      setTfaStatus(true);
      setJustEnabledTfa(true);
      setShowTfaEnableModal(false);
      // Refresh Auth Context User details
      const userRes = await api.get('/auth/me');
      updateUser(userRes.data.user);
    } catch (err) {
      setTfaError(err.response?.data?.error || 'Verification failed. Try again.');
    }
  };

  const handleConfirmTfaDisable = async () => {
    setDisableError('');
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setTfaStatus(false);
      setBackupCodes([]);
      setDisablePassword('');
      setShowTfaDisableModal(false);
      // Refresh Auth Context User details
      const userRes = await api.get('/auth/me');
      updateUser(userRes.data.user);
      alert('2FA disabled successfully.');
    } catch (err) {
      setDisableError(err.response?.data?.error || 'Incorrect password.');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!window.confirm('Are you sure you want to regenerate backup codes? Your previous codes will be invalidated.')) return;
    try {
      const res = await api.post('/auth/2fa/backup-codes/regenerate');
      setBackupCodes(res.data.backupCodes || []);
      alert('Backup codes regenerated successfully.');
    } catch (err) {
      alert('Failed to regenerate backup codes.');
    }
  };

  // Notifications Toggle
  const handleToggleNotif = async (key) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    try {
      const res = await api.put(`/users/${user.id || user._id}/settings`, {
        notificationSettings: updated,
      });
      updateUser(res.data.user);
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  // Privacy Toggle
  const handleTogglePrivacy = async (field, value) => {
    const updated = { ...privacyPrefs, [field]: value };
    setPrivacyPrefs(updated);
    try {
      const res = await api.put(`/users/${user.id || user._id}/settings`, {
        privacyPreferences: updated,
      });
      updateUser(res.data.user);
    } catch (err) {
      console.error('Failed to update privacy preferences:', err);
    }
  };

  // Developer Toggles & Actions
  const handleToggleDevMode = async () => {
    const newMode = !devMode;
    setDevMode(newMode);
    try {
      const res = await api.put(`/users/${user.id || user._id}/settings`, {
        developerMode: newMode,
      });
      updateUser(res.data.user);
    } catch (err) {
      console.error('Failed to toggle developer mode:', err);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      const res = await api.put(`/users/${user.id || user._id}/settings`, {
        developerWebhookUrl: webhookUrl,
      });
      updateUser(res.data.user);
      alert('Webhook URL updated successfully!');
    } catch (err) {
      alert('Failed to update webhook URL');
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Regenerating your API key will invalidate the current one. Continue?')) return;
    try {
      const res = await api.post(`/users/${user.id || user._id}/developer/regenerate-key`);
      setApiKey(res.data.apiKey);
      // Refresh user context
      const userRes = await api.get('/auth/me');
      updateUser(userRes.data.user);
      alert('New API key generated successfully!');
    } catch (err) {
      alert('Failed to regenerate API key');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="settings-section">
            <h2>Account Settings</h2>
            
            <form onSubmit={handleSaveAccount} className="settings-card">
              <div className="field-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  disabled
                  title="Usernames cannot be changed"
                />
                <span className="field-help">Usernames cannot be changed</span>
              </div>

              <div className="field-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field-group toggle-row" style={{ marginTop: '16px' }}>
                <div>
                  <span className="toggle-label" style={{ fontWeight: 600 }}>Developer Mode</span>
                  <p className="toggle-desc" style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Enable developer integrations and access personal API keys.
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={devMode}
                    onChange={handleToggleDevMode}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }} disabled={savingAccount}>
                {savingAccount ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>

            <form onSubmit={handleChangePassword} className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Change Password</h3>
              <div className="field-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-outline" disabled={updatingPassword}>
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className="settings-card danger-zone" style={{ marginTop: '24px', borderColor: 'var(--color-error)' }}>
              <h3 style={{ color: 'var(--color-error)' }}>Danger Zone</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Deleting your account will permanently wipe all your profile details, posts, code snippets, comments, and sessions. This action is irreversible.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="settings-section">
            <h2>Security Settings</h2>

            <div className="settings-card">
              <h3>Two-Factor Authentication (2FA)</h3>
              <div className="tfa-status">
                <span>Status:</span>
                <span className={`status-indicator ${tfaStatus ? 'enabled' : 'disabled'}`}>
                  {tfaStatus ? '● Enabled' : '○ Disabled'}
                </span>
              </div>

              {!tfaStatus ? (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Protect your account with an extra layer of security. Verify logins using code generated by Google Authenticator or other TOTP apps.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={handleStartTfaSetup}>
                    Enable 2FA
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Two-factor authentication is active on this account.
                  </p>
                  <button type="button" className="btn btn-danger" onClick={() => setShowTfaDisableModal(true)}>
                    Disable 2FA
                  </button>
                </div>
              )}

              {/* Just Enabled or Displaying Backup Codes */}
              {tfaStatus && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>Backup Codes</h4>
                    <button type="button" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={handleRegenerateBackupCodes}>
                      Regenerate
                    </button>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Store these backup codes safely. If you lose access to your authenticator app, you can use these to log into your account. Each code can only be used once.
                  </p>
                  {justEnabledTfa && (
                    <div style={{ padding: '8px 12px', background: 'rgba(74, 222, 128, 0.15)', border: '1px solid var(--color-success)', borderRadius: '4px', color: 'var(--color-success)', fontSize: 'var(--text-xs)', marginBottom: '12px', fontWeight: 600 }}>
                      ✓ 2FA Enabled! Please save your backup codes now.
                    </div>
                  )}
                  <div className="backup-codes-grid">
                    {backupCodes.map((code, index) => (
                      <kbd key={index} className="backup-code">{code}</kbd>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Active Sessions</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                This is a list of devices that have logged into your account. Revoke any session that you do not recognize.
              </p>
              <SessionList />
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="settings-section">
            <h2>Appearance Settings</h2>

            <div className="settings-card">
              <h3>Theme Preference</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Select your preferred application color mode.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark Mode (Default)
                </button>
                <button
                  type="button"
                  className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('light')}
                >
                  Light Mode
                </button>
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Font Size</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Adjust the scaling of body text and interface elements.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['small', 'medium', 'large'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`btn ${fontSize === sz ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textTransform: 'capitalize' }}
                    onClick={() => setFontSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Code Editor Monospace Font</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                Choose the font family rendered in markdown code blocks and snippet views.
              </p>
              <div className="field-group">
                <select
                  value={codeFont}
                  onChange={(e) => setCodeFont(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: '#111112',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    maxWidth: '300px'
                  }}
                >
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="Fira Code">Fira Code</option>
                  <option value="Cascadia Code">Cascadia Code</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="settings-section">
            <h2>Notification Preferences</h2>
            <div className="settings-card">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Control which activity triggers push notifications or inbox alerts.
              </p>

              {[
                { key: 'newFollowers', label: 'New Followers', desc: 'When another user starts following your profile.' },
                { key: 'postLikes', label: 'Post Likes', desc: 'When someone likes one of your quick posts or articles.' },
                { key: 'comments', label: 'Comments & Replies', desc: 'When someone leaves a comment on your code or posts.' },
                { key: 'mentions', label: 'Mentions', desc: 'When someone tags your @username in a post.' },
                { key: 'dms', label: 'Direct Messages', desc: 'When someone sends you a direct message.' },
                { key: 'jobApplications', label: 'Job Applications', desc: 'When a candidate applies to a job post you created.' },
                { key: 'blingAIUpdates', label: 'Bling AI Updates', desc: 'Alerts or suggestions generated by Bling Copilot.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="toggle-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span className="toggle-label">{label}</span>
                    <p className="toggle-desc" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{desc}</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifSettings[key]}
                      onChange={() => handleToggleNotif(key)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <div className="settings-card">
              <div className="toggle-row" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span className="toggle-label">Private Account</span>
                  <p className="toggle-desc" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Only users that you follow can view your articles and snippets.
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={privacyPrefs.visibility === 'private'}
                    onChange={(e) => handleTogglePrivacy('visibility', e.target.checked ? 'private' : 'public')}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="field-group" style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                <label style={{ fontWeight: 'normal', color: 'var(--color-text-primary)' }}>Who can direct message (DM) you</label>
                <select
                  value={privacyPrefs.dmPermission}
                  onChange={(e) => handleTogglePrivacy('dmPermission', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: '#111112',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    maxWidth: '300px',
                    marginTop: '8px'
                  }}
                >
                  <option value="everyone">Everyone</option>
                  <option value="following">Following Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="toggle-row" style={{ paddingTop: '16px' }}>
                <div>
                  <span className="toggle-label">Show SynkID Badge</span>
                  <p className="toggle-desc" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Display the "Powered by SynkID" verification badge on your profile.
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={privacyPrefs.showSynkId !== false}
                    onChange={(e) => handleTogglePrivacy('showSynkId', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        );
      case 'developer':
        return (
          <div className="settings-section">
            <h2>Developer Options</h2>
            <div className="settings-card">
              <h3>Personal API Key</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Use this API token to authenticate requests with Bling's developer API. Keep it secure and do not share it.
              </p>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={apiKey || 'No API key generated.'}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: '#08080c',
                    color: apiKey ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
                {apiKey && (
                  <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }} onClick={handleCopyKey}>
                    {copiedKey ? 'Copied ✓' : 'Copy'}
                  </button>
                )}
                <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }} onClick={handleRegenerateApiKey}>
                  {apiKey ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Webhook Integration</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Enter a webhook URL where Bling will send HTTP POST payloads when activity occurs (new followers, DMs, replies).
              </p>
              <div className="field-group">
                <label htmlFor="webhookUrl">Webhook URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://yourdomain.com/webhooks"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleSaveWebhook}>
                    Save URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`settings-page ${isMobile ? (mobileDetailView ? 'view-detail' : 'view-list') : ''} fade-in`}>
      <aside className="settings-sidebar">
        <ul>
          <li className={activeSection === 'account' ? 'active' : ''} onClick={() => handleSectionClick('account')}>
            Account
          </li>
          <li className={activeSection === 'security' ? 'active' : ''} onClick={() => handleSectionClick('security')}>
            Security
          </li>
          <li className={activeSection === 'appearance' ? 'active' : ''} onClick={() => handleSectionClick('appearance')}>
            Appearance
          </li>
          <li className={activeSection === 'notifications' ? 'active' : ''} onClick={() => handleSectionClick('notifications')}>
            Notifications
          </li>
          <li className={activeSection === 'privacy' ? 'active' : ''} onClick={() => handleSectionClick('privacy')}>
            Privacy
          </li>
          {devMode && (
            <li className={activeSection === 'developer' ? 'active' : ''} onClick={() => handleSectionClick('developer')}>
              Developer
            </li>
          )}
        </ul>
      </aside>

      <section className="settings-content">
        {isMobile && (
          <button 
            className="settings-back-btn"
            onClick={() => setMobileDetailView(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              padding: '0 0 16px 0',
              fontWeight: 600,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            BACK TO SETTINGS
          </button>
        )}
        {renderSection()}
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal" style={{ borderColor: 'var(--color-error)' }}>
            <h3 style={{ color: 'var(--color-error)', marginTop: 0 }}>Delete Your Account?</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '12px 0 20px' }}>
              Are you absolutely sure you want to delete your Bling account? This cannot be undone and you will lose all data.
            </p>
            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showTfaEnableModal && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal" style={{ width: '400px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-accent)' }}>Enable 2FA</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '8px 0 16px' }}>
              Scan the QR code below using your authentication application (e.g. Google Authenticator), then enter the 6-digit verification code.
            </p>
            
            {qrCodeData && (
              <div style={{ display: 'flex', justifyContent: 'center', background: '#fff', padding: '12px', borderRadius: '8px', width: 'fit-content', margin: '0 auto 16px' }}>
                <img src={qrCodeData} alt="2FA QR Code" style={{ width: '180px', height: '180px' }} />
              </div>
            )}

            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Secret: {tfaSecret}
            </div>

            <div className="field-group">
              <label htmlFor="tfaCode">Verification Code</label>
              <input
                id="tfaCode"
                type="text"
                maxLength="6"
                placeholder="000000"
                value={tfaCode}
                onChange={(e) => setTfaCode(e.target.value)}
                style={{ textAlign: 'center', fontSize: 'var(--text-lg)', letterSpacing: '4px' }}
              />
              {tfaError && <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{tfaError}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setShowTfaEnableModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmTfaEnable} disabled={tfaCode.length !== 6}>Verify Code</button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {showTfaDisableModal && (
        <div className="settings-modal-backdrop">
          <div className="settings-modal" style={{ width: '360px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-error)' }}>Disable 2FA</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '8px 0 16px' }}>
              To disable two-factor authentication, please confirm your account password.
            </p>

            <div className="field-group">
              <label htmlFor="disablePassword">Account Password</label>
              <input
                id="disablePassword"
                type="password"
                placeholder="Enter account password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              {disableError && <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{disableError}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setShowTfaDisableModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmTfaDisable} disabled={!disablePassword}>Disable 2FA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
