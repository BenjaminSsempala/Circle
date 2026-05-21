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
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let isMounted = true;

    // Timeout to ensure loading completes within 5 seconds
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('AuthContext: Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // Handle all auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`AuthContext: [${event}] triggered, session:`, newSession ? 'yes' : 'no');
        
        if (!isMounted) return;
        
        clearTimeout(loadingTimeout);
        setSession(newSession);

        if (newSession?.user) {
          try {
            console.log('AuthContext: Loading profile for user:', newSession.user.id);
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .maybeSingle();
            
            if (!isMounted) return;
            
            if (error) {
              console.error('AuthContext: Error loading profile:', error);
              // Create empty user on error
              setUser({
                id: newSession.user.id,
                full_name: newSession.user.user_metadata?.full_name || '',
                role: undefined,
                onboarding_complete: false,
              });
            } else if (profile) {
              console.log('AuthContext: Profile loaded:', profile.role);
              setUser({
                id: profile.id,
                full_name: profile.full_name || '',
                role: profile.role || undefined,
                onboarding_complete: profile.onboarding_complete || false,
              });
            } else {
              console.log('AuthContext: No profile row, creating empty user');
              setUser({
                id: newSession.user.id,
                full_name: newSession.user.user_metadata?.full_name || '',
                role: undefined,
                onboarding_complete: false,
              });
            }
          } catch (err) {
            console.error('AuthContext: Exception loading profile:', err);
            // Still create user even on exception
            setUser({
              id: newSession.user.id,
              full_name: newSession.user.user_metadata?.full_name || '',
              role: undefined,
              onboarding_complete: false,
            });
          }
        } else {
          console.log('AuthContext: No user in session');
          setUser(null);
        }

        // Always complete loading (after profile is loaded or errored)
        if (isMounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, []);


  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      // Always clear auth state, regardless of signOut success/failure
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  const refetchProfile = async () => {
    // Get user ID from current session in state
    if (!session?.user?.id) {
      console.log('refetchProfile: No session, skipping');
      return;
    }

    try {
      console.log('refetchProfile: Fetching profile for', session.user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('refetchProfile: Error:', error);
        return;
      }
      
      if (profile) {
        console.log('refetchProfile: Profile loaded:', profile.role);
        setUser({
          id: profile.id,
          full_name: profile.full_name || '',
          role: profile.role || undefined,
          onboarding_complete: profile.onboarding_complete || false,
        });
      } else {
        console.log('refetchProfile: No profile found');
      }
    } catch (err) {
      console.error('refetchProfile: Exception:', err);
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
