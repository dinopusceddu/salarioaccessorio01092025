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
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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
  signInWithPassword: async () => ({ error: null }),
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
    console.log('🔄 AuthContext: refreshProfile called, user:', user?.email);
    
    if (!user) {
      console.log('❌ AuthContext: No user, clearing profile');
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      console.log('📞 AuthContext: Calling DatabaseService.ensureProfile()');
      // Assicurati che il profilo esista, crealo se necessario
      const userProfile = await DatabaseService.ensureProfile();
      console.log('📋 AuthContext: Got profile:', userProfile);
      setProfile(userProfile);
      setRole(userProfile?.role || null);
      console.log('✅ AuthContext: Set role to:', userProfile?.role);
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing profile:', error);
      setProfile(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Ottieni la sessione iniziale
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('🔑 AuthContext: getSession() result:', { 
        sessionExists: !!session, 
        userEmail: session?.user?.email,
        error: error,
        accessToken: session?.access_token ? 'Present' : 'Missing'
      });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('✅ AuthContext: User found, loading profile...');
        await refreshProfile();
      } else {
        console.log('❌ AuthContext: No user session found');
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    }).catch(err => {
      console.error('🚨 AuthContext: getSession() error:', err);
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

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
    signInWithPassword,
    signOut,
    refreshProfile,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};