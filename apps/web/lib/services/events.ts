import { createClient } from '@/lib/supabase/server';

export type EventContact = {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
};

export type CircleEvent = {
  id: string;
  artist_id: string;
  title: string;
  date: string;
  time?: string | null;
  venue?: string | null;
  city?: string | null;
  ticket_url?: string | null;
  poster_url?: string | null;
  short_description?: string | null;
  full_info?: string | null;
  contacts: EventContact[];
  is_active: boolean;
  created_at: string;
};

export type EventInput = {
  title: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  ticket_url?: string;
  poster_url?: string;
  short_description?: string;
  full_info?: string;
  contacts: EventContact[];
  is_active?: boolean;
};

export async function getArtistEvents(artistId: string): Promise<CircleEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('artist_id', artistId)
    .eq('is_active', true)
    .order('date', { ascending: true });
  return (data ?? []) as CircleEvent[];
}

export async function getAllArtistEvents(artistId: string): Promise<CircleEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('artist_id', artistId)
    .order('date', { ascending: true });
  return (data ?? []) as CircleEvent[];
}

export async function createEvent(artistId: string, input: EventInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .insert({ artist_id: artistId, ...input, is_active: input.is_active ?? true })
    .select()
    .single();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, event: data as CircleEvent };
}

export async function updateEvent(eventId: string, artistId: string, input: Partial<EventInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', eventId)
    .eq('artist_id', artistId)
    .select()
    .single();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, event: data as CircleEvent };
}

export async function deleteEvent(eventId: string, artistId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('artist_id', artistId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
