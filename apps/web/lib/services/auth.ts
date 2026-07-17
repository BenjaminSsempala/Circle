import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';

async function sendConfirmationEmail(email: string, actionLink: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your email</title></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(0,84,64,0.25);max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#005440 0%,#00382b 100%);padding:40px 48px 36px;text-align:center;">
            <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">&#9670; Engero</p>
            <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.15;">Confirm your email</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.5;">You\'re almost there, one tap to activate your account.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px 32px;">
            <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.65;">Hi there,<br><br>We received a request to create an Engero account with this email address. Click the button below to confirm it&rsquo;s you and finish setting up your profile.</p>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding-bottom:32px;">
                <a href="${actionLink}"
                  style="display:inline-block;padding:16px 40px;background:#005440;color:#ffffff;border-radius:14px;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.01em;border:1px solid rgba(255,255,255,0.08);">
                  Confirm my email &rarr;
                </a>
              </td></tr>
            </table>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="border-top:1px solid rgba(0,84,64,0.25);"></td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.6;">If the button above doesn\'t work, copy and paste this link into your browser:</p>
            <p style="margin:0;font-size:11px;color:#4b5563;word-break:break-all;font-family:monospace;background:#1f2937;padding:12px 14px;border-radius:8px;border:1px solid rgba(0,84,64,0.15);">${actionLink}</p>

            <p style="margin:28px 0 0;font-size:12px;color:#6b7280;line-height:1.6;">If you didn\'t create an Engero account, you can safely ignore this email. This link expires in 24 hours.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d1117;padding:20px 48px;border-top:1px solid rgba(0,84,64,0.15);text-align:center;">
            <p style="margin:0;font-size:11px;color:#374151;letter-spacing:0.1em;text-transform:uppercase;font-family:monospace;">Engero &middot; engero.art &middot; Your professional home for your craft</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Confirm your Engero account',
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
      // Use the implicit flow redirect: after Supabase verifies the token via
      // the verify URL, it redirects to this page with #access_token=... appended.
      // The hash fragment never reaches the server, so we land on the login page
      // with ?confirmed=true showing the "✓ Email confirmed!" banner.
      redirectTo: `${siteUrl}/auth/login?confirmed=true`,
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
