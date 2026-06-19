import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? process.env.NEXT_PUBLIC_RESEND_API_KEY);
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function loadTemplate(filename: string): string {
  const filePath = join(process.cwd(), 'emails', filename);
  return readFileSync(filePath, 'utf-8');
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await getResend().emails.send({
    from: 'The Circle <onboarding@resend.dev>', // swap to notifications@yourdomain.co once domain is verified
    to: "benjspoetry@gmail.com", //temporarily hardcoded to my email for testing, should be `to` once verified
    subject,
    html,
  });

  if (error) {
    console.error('[email] Failed to send:', error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function sendArtistWelcomeEmail({
  to,
  artistName,
  artistSlug,
}: {
  to: string;
  artistName: string;
  artistSlug: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thecircle.co';
  const firstName = artistName.split(' ')[0];

  const html = renderTemplate(loadTemplate('artist-welcome.html'), {
    artist_name:   firstName,
    artist_slug:   artistSlug,
    profile_url:   `${siteUrl}/${artistSlug}`,
    dashboard_url: `${siteUrl}/dashboard`,
  });

  const { error } = await getResend().emails.send({
    from:    'The Circle <onboarding@resend.dev>', // swap to welcome@yourdomain.co once domain is verified
    to,
    subject: `Welcome to The Circle, ${firstName} 🎭`,
    html,
  });

  if (error) {
    console.error('[email] Failed to send artist welcome:', error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
