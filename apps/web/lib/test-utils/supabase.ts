import { vi } from 'vitest';

/** Creates a fluent chainable Supabase mock where the terminal call resolves to result.
 * Mutation methods (insert/update/upsert/delete) are ALSO directly awaitable
 * (they return a thenable chain), so code that does `await client.from(t).upsert(...)`
 * without further chaining still gets the mocked result.
 */
export function makeChain(result: unknown) {
  // Make the chain itself a thenable so `await chain` resolves to result
  const chain: Record<string, unknown> & { then?: unknown; catch?: unknown } = {};
  const terminal = vi.fn().mockResolvedValue(result);

  // Filtering/ordering methods return the same chain for further chaining
  for (const m of ['select','eq','neq','in','not','is','gte','lte','gt','lt','order','limit','contains','ilike','like']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  // Mutation methods return the chain (chainable) AND the chain is a thenable
  for (const m of ['insert','update','upsert','delete']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods
  chain['maybeSingle'] = terminal;
  chain['single'] = terminal;

  // Make the chain thenable so direct `await from(table).upsert(...)` works
  chain['then'] = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    Promise.resolve(result).then(resolve, reject);
  chain['catch'] = (reject: (e: unknown) => void) =>
    Promise.resolve(result).catch(reject);

  return chain;
}

/** For insert().select().single() patterns */
export function makeInsertChain(result: unknown) {
  const chain = makeChain(result) as Record<string, unknown>;
  // insert returns a chain that also has select
  return chain;
}

export function makeErrorChain(error: { message: string; code?: string }) {
  return makeChain({ data: null, error });
}

/** Creates a mock Supabase client where from() returns different chains based on table name */
export function makeMockClient(tableMap: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => tableMap[table] ?? makeChain({ data: null, error: null })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/**
 * Creates a single client where each table can return a SEQUENCE of responses.
 * Use when a function calls from(table) multiple times on the same client instance.
 * responses: { tableName: [firstCallResult, secondCallResult, ...] }
 * If a table runs out of responses, the last one is repeated.
 */
export function makeSequentialClient(responses: Record<string, unknown[]>) {
  const counters: Record<string, number> = {};
  const client = {
    from: vi.fn((table: string) => {
      const idx = counters[table] ?? 0;
      counters[table] = idx + 1;
      const tableResponses = responses[table] ?? [{ data: null, error: null }];
      const response = tableResponses[Math.min(idx, tableResponses.length - 1)];
      return makeChain(response);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return client;
}
