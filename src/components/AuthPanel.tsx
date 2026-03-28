import React, { useState } from 'react';

interface AuthPanelProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

export function AuthPanel({ onSignIn, onSignUp }: AuthPanelProps): React.ReactElement {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password.trim()) return;
    if (tab === 'register' && !username.trim()) {
      setError('Username is required');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password, username.trim());
        setInfo('Check your email to confirm your account.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-panel">
      <div className="auth-tabs">
        <button
          className={`auth-tab${tab === 'login' ? ' active' : ''}`}
          onClick={() => switchTab('login')}
        >
          Sign in
        </button>
        <button
          className={`auth-tab${tab === 'register' ? ' active' : ''}`}
          onClick={() => switchTab('register')}
        >
          Register
        </button>
      </div>

      <div className="auth-fields">
        {tab === 'register' && (
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        )}
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {error && <p className="auth-error">{error}</p>}
      {info && <p className="auth-info">{info}</p>}

      <button
        className="auth-submit-btn"
        onClick={handleSubmit}
        disabled={loading || !email.trim() || !password.trim()}
      >
        {loading ? '...' : tab === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </div>
  );
}
