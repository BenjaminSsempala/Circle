export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signInWithEmail } from '@/lib/services/auth';

// POST /api/auth/login
// Body: { email, password }
// Called by: web login page, Flutter app
// Returns: { userId, role, onboardingComplete, redirectTo }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return err('email and password are required', 422);
  }

  const result = await signInWithEmail(body.email, body.password);

  if (!result.ok) return err(result.error, result.status);

  return ok({
    userId:              result.userId,
    role:                result.role,
    onboardingComplete:  result.onboardingComplete,
    redirectTo:          result.redirectTo,
  });
}
