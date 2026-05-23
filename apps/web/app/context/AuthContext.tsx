'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  role?: 'artist' | 'organiser';
  onboarding_complete?: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to keep the Supabase client stable across renders
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  /**
   * Helper function to fetch profile data and update state.
   * This ensures consistent behavior between initial load and auth changes.
   */
  const loadUserData = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      console.log('AuthContext: No session found, clearing user state.');
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setSession(currentSession);
    const userId = currentSession.user.id;

    try {
      console.log('AuthContext: Fetching profile for:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        // Fallback to basic user info from session metadata if DB fetch fails
        setUser({
          id: userId,
          full_name: currentSession.user.user_metadata?.full_name || '',
          role: undefined,
          onboarding_complete: false,
        });
      } else if (profile) {
        console.log('AuthContext: Profile loaded with role:', profile.role);
        setUser({
          id: profile.id,
          full_name: profile.full_name || '',
          role: profile.role || undefined,
          onboarding_complete: profile.onboarding_complete || false,
        });
      } else {
        console.log('AuthContext: No profile row found in DB.');
        setUser({
          id: userId,
          full_name: currentSession.user.user_metadata?.full_name || '',
          role: undefined,
          onboarding_complete: false,
        });
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error during profile load:', err);
    } finally {
      // CRITICAL: Always stop loading regardless of success/fail
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Kickstart: Check session immediately on mount
    const initializeAuth = async () => {
      console.log('AuthContext: Performing initial session check...');
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (isMounted) {
        await loadUserData(initialSession);
      }
    };

    initializeAuth();

    // 2. Listener: Handle login, logout, and token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`AuthContext: [${event}] triggered.`);
        
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUserData(newSession);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('AuthContext: Error during signOut:', err);
    } finally {
      // Immediate UI cleanup
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  /**
   * Manual refetch method (e.g., call this after updating a user's role)
   */
  const refetchProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      console.log('AuthContext: Manually refetching profile...');
      await loadUserData(currentSession);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut: handleSignOut,
        isAuthenticated: !!session?.user,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}