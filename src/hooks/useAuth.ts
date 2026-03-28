import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { bridgeLoadSession, bridgeClearSession, BRIDGE_KEY } from '../lib/authBridge';
import type { User } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

export function getDisplayName(user: User): string {
  return user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'User';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setLoading(false);
        return;
      }
      // Spróbuj przywrócić sesję z chrome.storage.local (zalogowano przez popup)
      const bridgeSession = await bridgeLoadSession() as Session | null;
      if (bridgeSession) {
        const { data, error } = await supabase.auth.setSession(bridgeSession);
        if (!error && data.session) {
          setUser(data.user);
        } else {
          await bridgeClearSession();
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const chr = (globalThis as any).chrome;
    const handleStorageChange = async (changes: Record<string, { newValue?: unknown }>) => {
      if (!(BRIDGE_KEY in changes)) return;
      const newSession = changes[BRIDGE_KEY].newValue as Session | undefined;
      if (!newSession) {
        await supabase.auth.signOut();
        setUser(null);
      } else {
        const { data, error } = await supabase.auth.setSession(newSession);
        if (!error && data.session) setUser(data.user);
      }
    };
    chr?.storage?.onChanged?.addListener(handleStorageChange);

    return () => {
      subscription.unsubscribe();
      chr?.storage?.onChanged?.removeListener(handleStorageChange);
    };
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
  };

  return {
    user,
    loading,
    displayName: user ? getDisplayName(user) : 'You',
    signIn,
    signUp,
    signOut,
  };
}
