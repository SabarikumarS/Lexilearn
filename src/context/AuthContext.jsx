import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

/** Check whether Supabase credentials are real (not placeholder) */
function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  return url.length > 10 && !url.includes('placeholder');
}

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, name) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;

    if (data.user) {
      // Best-effort profile creation (ignore errors – table may not exist yet)
      try { await supabase.from('profiles').insert([{ id: data.user.id, email, full_name: name }]); } catch (_) {}
      try { await supabase.from('progress').insert([{ user_id: data.user.id }]); } catch (_) {}
    }
    return data;
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error('[AuthContext] signOut error:', e);
    } finally {
      setUser(null);
    }
  };

  /** True when no user is logged in (guest mode) */
  const isGuest = !user;

  return (
    <AuthContext.Provider value={{ user, isGuest, signUp, signIn, signInWithGoogle, signOut, loading, isSupabaseConfigured }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);