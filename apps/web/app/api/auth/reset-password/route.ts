import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { sendPasswordReset } from '@/lib/services/auth';

// POST /api/auth/reset-password
// Body: { email }
// Called by: web reset-password page, Flutter app
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email) {
    return err('email is required', 422);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const result  = await sendPasswordReset(body.email, siteUrl);

  if (!result.ok) return err(result.error, result.status);

  // Always return ok — don't reveal whether the email exists
  return ok({ message: 'If that email exists, a reset link has been sent.' });
}
