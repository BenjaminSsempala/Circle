'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  display_name?: string;
  legal_name?: string;
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
  
  // Track mounting state and loaded profiles to avoid leaks and duplicate loads
  const isMountedRef = useRef(true);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  
  // Use a ref to keep the Supabase client stable across renders.
  // createClient() returns null when NEXT_PUBLIC_SUPABASE_URL is absent (e.g. at build time).
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // If Supabase is not configured (build-time SSR), render children immediately without auth
  if (!supabase) {
    return <AuthContext.Provider value={{ session: null, user: null, loading: false, isAuthenticated: false, signOut: async () => {}, refetchProfile: async () => {} }}>{children}</AuthContext.Provider>;
  }

  /**
   * Helper function to fetch profile data and update state.
   * This ensures consistent behavior between initial load and auth changes.
   */
  const loadUserData = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      console.log('AuthContext: No session found, clearing user state.');
      if (isMountedRef.current) {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
      return;
    }

    const userId = currentSession.user.id;

    // Skip if we already fetched/are fetching this user profile
    if (lastFetchedUserIdRef.current === userId && user?.id === userId) {
      console.log('AuthContext: Profile already loaded for:', userId);
      if (isMountedRef.current) {
        setSession(currentSession);
        setLoading(false);
      }
      return;
    }

    lastFetchedUserIdRef.current = userId;

    if (isMountedRef.current) {
      setSession(currentSession);
    }

    try {
      console.log('AuthContext: Fetching profile for:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (error) {
        console.error('AuthContext: Error fetching profile:', error);
        // Fallback to basic user info from session metadata if DB fetch fails
        setUser({
          id: userId,
          display_name: currentSession.user.user_metadata?.display_name || '',
          role: undefined,
          onboarding_complete: false,
        });
      } else if (profile) {
        console.log('AuthContext: Profile loaded with role:', profile.role);
        setUser({
          id: profile.id,
          display_name: profile.display_name || '',
          role: profile.role || undefined,
          onboarding_complete: profile.onboarding_complete || false,
        });
      } else {
        console.log('AuthContext: No profile row found in DB.');
        setUser({
          id: userId,
          display_name: currentSession.user.user_metadata?.display_name || '',
          role: undefined,
          onboarding_complete: false,
        });
      }
    } catch (err) {
      console.error('AuthContext: Unexpected error during profile load:', err);
    } finally {
      // CRITICAL: Always stop loading regardless of success/fail
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial Kickstart: Check session immediately on mount
    const initializeAuth = async () => {
      console.log('AuthContext: Performing initial session check...');
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (isMountedRef.current) {
        if (initialSession) {
          // 2. Fetch profile immediately if session exists
          await loadUserData(initialSession);
        } else {
          // 3. No session? Stop loading immediately so guards can redirect
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listener: Handle login, logout, and token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`AuthContext: [${event}] triggered.`);
        
        if (!isMountedRef.current) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (newSession) {
            // Defer execution of loadUserData to avoid deadlock/locks issue inside onAuthStateChange callback
            setTimeout(() => {
              if (isMountedRef.current) {
                loadUserData(newSession);
              }
            }, 0);
          }
        }
        else if (event === 'SIGNED_OUT') {
          lastFetchedUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        else {
          setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth/login'; 
    } catch (err) {
      console.error('AuthContext: Error during signOut:', err);
    } finally {
      // Immediate UI cleanup
      lastFetchedUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  /**
   * Manual refetch method (e.g., call this after updating a user's role)
   */

  const refetchProfile = async () => {
    if (isMountedRef.current) {
      setLoading(true); // Ensure UI knows we are working
    }
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession) {
      console.log('AuthContext: Manually refetching profile...');
      lastFetchedUserIdRef.current = null; // Clear key to bypass cache
      await loadUserData(currentSession);
    } else {
      // If we get here and there's no session, we must stop loading
      if (isMountedRef.current) {
        setLoading(false);
        setSession(null);
        setUser(null);
      }
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