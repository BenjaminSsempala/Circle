import { createClient } from '@/lib/supabase/server';

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) return { ok: false, error: error.message, status: 400 };
  return { ok: true, userId: data.user?.id };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message, status: 401 };

  const userId = data.user?.id;
  if (!userId) return { ok: false, error: 'User not found', status: 400 };

  // Block login if email not yet confirmed
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.',
      status: 401,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', userId)
    .single();

  const redirectTo = resolveRedirectPath(profile?.role, profile?.onboarding_complete);

  return {
    ok: true,
    userId,
    role: profile?.role ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
    redirectTo,
  };
}

export async function setUserRole(userId: string, role: 'artist' | 'audience', fullName: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, role, full_name: fullName, onboarding_complete: false });

  if (error) return { ok: false, error: error.message, status: 400 };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

function resolveRedirectPath(role: string | null | undefined, onboardingComplete: boolean | null | undefined): string {
  if (!role) return '/auth/signup?step=role'; // no role yet — pick one first
  if (!onboardingComplete) {
    return role === 'audience' ? '/discover' : '/onboarding/artist';
  }
  return role === 'audience' ? '/discover' : '/dashboard';
}

export async function resolveRedirect(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', userId)
    .single();

  return {
    userId,
    role: profile?.role ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
    redirectTo: resolveRedirectPath(profile?.role, profile?.onboarding_complete),
  };
}

export async function sendPasswordReset(email: string, siteUrl: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,  // client page handles hash token
  });

  if (error) return { ok: false, error: error.message, status: 400 };
  return { ok: true };
}
