import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { ok, err, requireArtistOwnership } from '../../lib/response';

const ConnectSchema = z.object({
  platform:    z.enum(['youtube', 'tiktok', 'instagram', 'spotify', 'soundcloud']),
  accessToken: z.string(),
  channelId:   z.string().optional(),
  channelName: z.string().optional(),
});

export async function connect(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const body   = await req.json();
  const parsed = ConnectSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.message, 422);

  const { platform, accessToken, channelId, channelName } = parsed.data;

  const { data, error } = await supabase
    .from('platform_connections')
    .upsert(
      {
        artist_id:    params.id,
        platform,
        connected:    true,
        access_token: accessToken,
        channel_id:   channelId,
        channel_name: channelName,
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: 'artist_id,platform' },
    )
    .select()
    .single();

  if (error) return err('Failed to save platform connection', 500);
  return ok(data);
}

export async function disconnect(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const { platform } = await req.json() as { platform: string };

  const { error } = await supabase
    .from('platform_connections')
    .update({ connected: false, access_token: null })
    .eq('artist_id', params.id)
    .eq('platform', platform);

  if (error) return err('Failed to disconnect platform', 500);
  return ok({ disconnected: true });
}

export async function youtubeVideos(req: NextRequest, { params }: { params: { id: string } }) {
  const { authorized } = await requireArtistOwnership(req, params.id);
  if (!authorized) return err('Unauthorized', 401);

  const { data: conn } = await supabase
    .from('platform_connections')
    .select('access_token, channel_id')
    .eq('artist_id', params.id)
    .eq('platform', 'youtube')
    .eq('connected', true)
    .single();

  if (!conn?.access_token) return err('YouTube not connected', 404);

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${conn.channel_id}&maxResults=50&order=date&type=video`,
    { headers: { Authorization: `Bearer ${conn.access_token}` } },
  );

  if (!res.ok) return err('Failed to fetch YouTube videos', 502);
  const json = await res.json();

  const videos = (json.items ?? []).map((item: any) => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    thumbnail:   item.snippet.thumbnails?.medium?.url,
    publishedAt: item.snippet.publishedAt,
    url:         `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));

  return ok(videos);
}
