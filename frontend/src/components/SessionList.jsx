import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './SessionList.css';

function SessionList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Could not load sessions');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      // Refresh list after revocation
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError('Could not revoke session');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) return <p>Loading active sessions...</p>;
  if (error) return <p className="error">{error}</p>;

  if (sessions.length === 0) return <p>No active sessions found.</p>;

  return (
    <div className="session-list">
      <table className="session-table">
        <thead>
          <tr>
            <th>Device / OS</th>
            <th>IP Address</th>
            <th>Location</th>
            <th>Login Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.sessionId} className={s.active ? 'active' : ''}>
              <td>{s.device || 'Unknown'}</td>
              <td>{s.ipAddress}</td>
              <td>{s.location || '—'}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
              <td>
                <button
                  className="btn btn-outline btn-revoke"
                  onClick={() => revokeSession(s.sessionId)}
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SessionList;
