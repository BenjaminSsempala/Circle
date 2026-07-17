

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }));

import { createServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import { signUpWithEmail } from '@/lib/services/auth';

const mockCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;
const mockSendEmail = sendEmail as unknown as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeServiceClientWithGenerateLink() {
  const generateLink = vi.fn().mockResolvedValue({
    data: {
      properties: { action_link: 'https://example.com/confirm?code=abc123' },
      user: { id: 'user-test-123' },
    },
    error: null,
  });

  const client = {
    auth: {
      admin: { generateLink },
    },
  };

  return { client, generateLink };
}

// ─── Bug Condition Exploration ────────────────────────────────────────────────

describe('signUpWithEmail — redirect fix: redirectTo must point to login page with ?confirmed=true', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls generateLink with redirectTo pointing to /auth/login?confirmed=true', async () => {
    /**
     * Property 1: Redirect Fix
     *
     * For any signUpWithEmail call, the redirectTo passed to generateLink
     * MUST be set to "/auth/login?confirmed=true" so that after Supabase
     * verifies the token via the implicit flow, the user lands on the login
     * page with the "✓ Email confirmed!" banner.
     *
     * The hash fragment (#access_token=...) appended by Supabase's implicit
     * flow never reaches the server, so the login page receives only
     * ?confirmed=true.
     */
    const { client, generateLink } = makeServiceClientWithGenerateLink();
    mockCreateServiceClient.mockReturnValue(client);
    mockSendEmail.mockResolvedValue({ ok: true });

    await signUpWithEmail('user@example.com', 'password123', 'Test User');

    expect(generateLink).toHaveBeenCalledOnce();

    const callArgs = generateLink.mock.calls[0][0];
    const redirectTo: string = callArgs.options.redirectTo;

    expect(redirectTo).toMatch(/\/auth\/login\?confirmed=true$/);
  });

  it('does NOT call generateLink with the old Route Handler path /api/auth/confirm', async () => {
    /**
     * Negative assertion: the old PKCE Route Handler path must not appear
     * as the redirectTo value after the implicit-flow fix.
     */
    const { client, generateLink } = makeServiceClientWithGenerateLink();
    mockCreateServiceClient.mockReturnValue(client);
    mockSendEmail.mockResolvedValue({ ok: true });

    await signUpWithEmail('user@example.com', 'password123', 'Test User');

    const callArgs = generateLink.mock.calls[0][0];
    const redirectTo: string = callArgs.options.redirectTo;

    expect(redirectTo).not.toContain('/api/auth/confirm');
  });
});

// ─── Preservation Tests ───────────────────────────────────────────────────────

/**
 * Preservation Property Tests — signUpWithEmail Success Path
 *
 * These tests verify the behaviour that the fix MUST NOT break.
 * They encode the success-path contract of signUpWithEmail as it stands on
 * unfixed code, so they act as a regression guard during and after the fix.
 *
 * EXPECTED OUTCOME on unfixed code: ALL PASS
 * EXPECTED OUTCOME on fixed code:   ALL PASS (preservation confirmed)
 *
 * Validates: Requirements 2.1, 2.2
 */

import fc from 'fast-check';

describe('signUpWithEmail — preservation: success path must survive the redirect fix', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function setupMocks() {
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: 'https://supabase.example.com/auth/v1/verify?token=abc123&redirect_to=http://localhost:3000/auth/confirm',
        },
        user: { id: 'user-123' },
      },
      error: null,
    });

    const client = { auth: { admin: { generateLink } } };
    mockCreateServiceClient.mockReturnValue(client);
    mockSendEmail.mockResolvedValue({ ok: true });

    return { generateLink };
  }

  // ─── Property 2a: success path returns { ok: true, userId: <non-empty string> } ──

  it('returns { ok: true, userId: non-empty string } for any valid input (property)', async () => {
    /**
     * Property 2a: Preservation
     *
     * For all valid (email, password, fullName) inputs, signUpWithEmail
     * returns { ok: true, userId: <non-empty string> }.
     *
     * EXPECTED OUTCOME on unfixed code: PASS
     * EXPECTED OUTCOME on fixed code:   PASS
     *
     * Validates: Requirements 2.1
     */
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, password, fullName) => {
          vi.clearAllMocks();
          setupMocks();

          const result = await signUpWithEmail(email, password, fullName);

          expect(result.ok).toBe(true);
          expect(typeof (result as { ok: true; userId?: string }).userId).toBe('string');
          expect((result as { ok: true; userId?: string }).userId).not.toBe('');
        },
      ),
      { numRuns: 20 },
    );
  });

  // ─── Property 2b: sendEmail called exactly once with the user's email ────────

  it('calls sendEmail exactly once with the user\'s email address (property)', async () => {
    /**
     * Property 2b: Preservation
     *
     * For all valid inputs, sendEmail is invoked exactly once and the `to`
     * field of that call equals the email passed to signUpWithEmail.
     *
     * EXPECTED OUTCOME on unfixed code: PASS
     * EXPECTED OUTCOME on fixed code:   PASS
     *
     * Validates: Requirements 2.2
     */
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 64 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, password, fullName) => {
          vi.clearAllMocks();
          setupMocks();

          await signUpWithEmail(email, password, fullName);

          expect(mockSendEmail).toHaveBeenCalledOnce();
          const sendEmailArg = mockSendEmail.mock.calls[0][0] as { to: string; subject: string; html: string };
          expect(sendEmailArg.to).toBe(email);
        },
      ),
      { numRuns: 20 },
    );
  });

  // ─── Concrete: generateLink error → returns { ok: false } ───────────────────

  it('returns { ok: false } when generateLink returns an error', async () => {
    /**
     * Error handling preservation: if Supabase Admin returns an error from
     * generateLink, signUpWithEmail must return { ok: false }.
     *
     * EXPECTED OUTCOME on unfixed code: PASS
     * EXPECTED OUTCOME on fixed code:   PASS
     *
     * Validates: Requirements 2.1
     */
    const generateLink = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });
    mockCreateServiceClient.mockReturnValue({ auth: { admin: { generateLink } } });

    const result = await signUpWithEmail('taken@example.com', 'password123', 'Test User');

    expect(result.ok).toBe(false);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // ─── Concrete: sendEmail failure → returns { ok: false } ────────────────────

  it('returns { ok: false } when sendEmail fails', async () => {
    /**
     * Error propagation preservation: if the email send fails, signUpWithEmail
     * must surface the failure and return { ok: false }.
     *
     * EXPECTED OUTCOME on unfixed code: PASS
     * EXPECTED OUTCOME on fixed code:   PASS
     *
     * Validates: Requirements 2.2
     */
    const generateLink = vi.fn().mockResolvedValue({
      data: {
        properties: {
          action_link: 'https://supabase.example.com/auth/v1/verify?token=abc123',
        },
        user: { id: 'user-123' },
      },
      error: null,
    });
    mockCreateServiceClient.mockReturnValue({ auth: { admin: { generateLink } } });
    mockSendEmail.mockResolvedValue({ ok: false, error: 'Resend API error' });

    const result = await signUpWithEmail('user@example.com', 'password123', 'Test User');

    expect(result.ok).toBe(false);
  });
});
