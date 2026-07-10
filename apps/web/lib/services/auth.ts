import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';

async function sendConfirmationEmail(email: string, actionLink: string) {
  const html = `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111827; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Confirm your email</h1>
      <p style="margin: 0 0 16px;">Click the button below to confirm your email and finish creating your Engero account.</p>
      <p>
        <a href="${actionLink}" style="display:inline-block;padding:14px 24px;background:#047857;color:#ffffff;border-radius:12px;text-decoration:none;font-weight:600;">Confirm my email</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #6b7280;">${actionLink}</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Confirm your email for Engero',
    html,
  });
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const supabase = createServiceClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: { display_name: fullName },
      redirectTo: `${siteUrl}/api/auth/confirm`,
    },
  });

  if (error) return { ok: false, error: error.message, status: 400 };
  if (!data?.properties?.action_link) {
    return { ok: false, error: 'Failed to generate confirmation link', status: 500 };
  }

  const { ok, error: emailError } = await sendConfirmationEmail(email, data.properties.action_link);
  if (!ok) {
    return { ok: false, error: emailError ?? 'Failed to send confirmation email', status: 500 };
  }

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
    .upsert({
      id: userId,
      role,
      display_name: fullName,
      legal_name: fullName,
      onboarding_complete: false,
    });

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
