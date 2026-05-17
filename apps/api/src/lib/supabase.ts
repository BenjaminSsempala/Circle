// Placeholder supabase client export for local dev
export const supabase = {
  from: (table: string) => ({
    select: (...args: any[]) => ({ eq: (_k: string, _v: any) => ({ single: async () => ({ data: null }) }) }),
    upsert: (..._a: any[]) => ({ select: async () => ({ data: null }) }),
    insert: (..._a: any[]) => ({ select: async () => ({ data: null }) }),
    update: (..._a: any[]) => ({ eq: (_k: string, _v: any) => ({}) }),
    delete: () => ({ eq: (_k: string, _v: any) => ({}) }),
    order: () => ({})
  })
} as any;
