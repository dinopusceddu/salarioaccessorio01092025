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
  const refreshProfile = async (sessionUser?: User | null) => {
    const currentUser = sessionUser || user;
    console.log('🔄 AuthContext: refreshProfile called, user:', currentUser?.email);
    
    if (!currentUser) {
      console.log('❌ AuthContext: No user, clearing profile');
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      console.log('📞 AuthContext: Calling DatabaseService.ensureProfile()');
      
      // Timeout per evitare blocchi infiniti
      const profilePromise = DatabaseService.ensureProfile();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000)
      );
      
      const userProfile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null;
      console.log('📋 AuthContext: Got profile:', userProfile);
      setProfile(userProfile);
      setRole(userProfile?.role || null);
      console.log('✅ AuthContext: Set role to:', userProfile?.role);
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing profile:', error);
      
      // FALLBACK: Se sei l'admin hardcodato, bypassa il problema
      if (currentUser?.email === 'dino.pusceddu@cgil.lombardia.it') {
        console.log('🔧 FALLBACK: Setting hardcoded admin role');
        const fallbackProfile: UserProfile = { 
          id: currentUser.id, 
          email: currentUser.email || '', 
          role: 'admin',
          created_at: new Date().toISOString()
        };
        setProfile(fallbackProfile);
        setRole('admin');
      } else {
        setProfile(null);
        setRole(null);
      }
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
        await refreshProfile(session.user);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthContext: Auth state change:', { 
        event, 
        sessionExists: !!session, 
        userEmail: session?.user?.email 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('✅ AuthContext: Auth state change - User found, loading profile...');
        await refreshProfile(session.user);
      } else {
        console.log('❌ AuthContext: Auth state change - No user, clearing profile');
        setProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    console.log('🔐 AuthContext: signInWithPassword called for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('🔐 AuthContext: signInWithPassword result:', { 
      success: !!data.session, 
      userEmail: data.user?.email,
      error: error?.message 
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