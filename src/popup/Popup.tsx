import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../lib/supabase';
import { getDisplayName } from '../hooks/useAuth';
import { bridgeSaveSession, bridgeClearSession, bridgeLoadSession } from '../lib/authBridge';
import type { User } from '@supabase/supabase-js';
import './popup.css';

declare const chrome: any;

interface ExtensionStatus {
  active: boolean;
  version: string;
}

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

function AuthForm({ onSignIn, onSignUp }: AuthFormProps): React.ReactElement {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError(null);
    setInfo(null);
    setPendingConfirmEmail(null);
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
        setPendingConfirmEmail(email.trim());
        setPassword('');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!pendingConfirmEmail) return;
    setError(null);
    setInfo(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: pendingConfirmEmail,
      });
      if (resendError) throw new Error(resendError.message);
      setInfo('Confirmation email resent.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div className="auth-section">
      <div className="auth-tabs">
        <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
          Sign in
        </button>
        <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
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

      {pendingConfirmEmail && (
        <button onClick={handleResend} style={{ marginTop: 8 }}>
          Resend confirmation email
        </button>
      )}
    </div>
  );
}

// ── Popup ─────────────────────────────────────────────────────────────────────

function Popup(): React.ReactElement {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Pobierz status rozszerzenia
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: ExtensionStatus) => {
      if (chrome.runtime.lastError) return;
      setStatus(response);
    });
  }, []);

  // Inicjalizacja sesji Supabase w kontekście popupu
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (mounted) { setUser(session.user); setAuthLoading(false); }
        return;
      }

      const bridgeSession = await bridgeLoadSession() as import('@supabase/supabase-js').Session | null;
      if (bridgeSession) {
        const { data, error } = await supabase.auth.setSession(bridgeSession);
        if (!error && data.session) {
          if (mounted) setUser(data.user);
        } else {
          await bridgeClearSession();
        }
      }
      if (mounted) setAuthLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) setUser(session?.user ?? null);
      if (session) {
        await bridgeSaveSession(session);
      } else if (event === 'SIGNED_OUT') {
        await bridgeClearSession();
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await bridgeClearSession();
  };

  const version = status?.version ?? chrome.runtime.getManifest().version;
  const displayName = user ? getDisplayName(user) : null;
  const initials = displayName?.charAt(0).toUpperCase() ?? '';

  return (
    <>
      <div className="popup">

        {/* Header */}
        <div className="popup-header">
          <div className="popup-logo">CC</div>
          <div>
            <div className="popup-title">CrunchyrollComments</div>
            <div className="popup-version">v{version}</div>
          </div>
        </div>

        {/* Auth section */}
        {!authLoading && (
          user ? (
            <div className="user-bar">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{displayName}</span>
              <button className="user-signout-btn" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <AuthForm onSignIn={signIn} onSignUp={signUp} />
          )
        )}

        {/* Status */}
        <div className="status-row">
          <span className="status-label">Status rozszerzenia</span>
          <span className={`status-badge ${status?.active ? 'status-badge--active' : 'status-badge--inactive'}`}>
            {status?.active ? 'Aktywne' : 'Ładowanie...'}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Obsługiwane strony</span>
          <span className="status-label">Crunchyroll</span>
        </div>

        <div className="popup-footer">
          {user ? `Zalogowany jako ${displayName}` : 'Zaloguj się aby komentować'}
        </div>
      </div>
    </>
  );
}

// Montuj popup
const root = document.getElementById('popup-root');
if (root) {
  createRoot(root).render(<Popup />);
}
