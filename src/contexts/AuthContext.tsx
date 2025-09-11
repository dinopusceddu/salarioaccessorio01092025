import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { DatabaseService, UserProfile } from '../services/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signInWithOtp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  refreshProfile: async () => {},
  isAdmin: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  // Funzione per ricaricare il profilo utente (crea se non esiste)
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      // Assicurati che il profilo esista, crealo se necessario
      const userProfile = await DatabaseService.ensureProfile();
      setProfile(userProfile);
      setRole(userProfile?.role || null);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setProfile(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Ottieni la sessione iniziale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    // Ascolta i cambiamenti nell'autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Reindirizza alla dashboard dopo il login
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const isAdmin = () => role === 'admin';

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    signInWithOtp,
    signOut,
    refreshProfile,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};