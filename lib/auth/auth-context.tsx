'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { aiRequestHeaders } from '@/lib/ai-request-headers';
import {
  createBrowserSupabaseClient,
  isSupabaseAuthConfigured,
} from '@/lib/supabase/browser';

export type AuthUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  provider: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: AuthUser | null };
  return data.user ?? null;
}

async function claimDeviceHistory() {
  try {
    await fetch('/api/auth/claim-device', {
      method: 'POST',
      headers: aiRequestHeaders(),
    });
  } catch {
    // Non-blocking; history still works by user_id for new saves.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseAuthConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(configured);

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchMe();
      setUser(next);
      if (next) {
        await claimDeviceHistory();
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    // Defer so the effect body doesn't synchronously setState (lint).
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    if (!configured) {
      return () => window.clearTimeout(timer);
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      void (async () => {
        if (event === 'SIGNED_IN') {
          await claimDeviceHistory();
        }
        await refresh();
      })();
    });

    return () => {
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [configured, refresh]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      window.location.pathname.startsWith('/pages') ? '/pages' : '/pages'
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      console.error('[auth] Google sign-in failed', error);
      throw error;
    }
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      refresh,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, configured, refresh, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
