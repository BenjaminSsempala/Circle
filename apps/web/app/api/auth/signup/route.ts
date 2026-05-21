import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signUpWithEmail } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/signup
// Body: { email, password, fullName }
// Called by: web signup page, Flutter app
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password || !body?.fullName) {
    return err('email, password and fullName are required', 422);
  }

  if (body.password.length < 8) {
    return err('Password must be at least 8 characters', 422);
  }

  // Check if email already exists in auth.users
  const supabase = await createClient();
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', body.email)
    .maybeSingle();
    

  if (existingUser) {
    return err('This email is already registered. Please log in instead.', 422);
  }

  const result = await signUpWithEmail(body.email, body.password, body.fullName);

  if (!result.ok) return err(result.error, result.status);

  // Account created — frontend should now show the email confirmation step
  return ok({ userId: result.userId, nextStep: 'email_confirmation' }, 201);
}
