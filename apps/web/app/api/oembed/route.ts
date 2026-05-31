import { ok, err } from '@/lib/api';

function getOembedEndpoint(url: string): string | null {
  if (/youtube\.com|youtu\.be/.test(url))
    return `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  if (/open\.spotify\.com/.test(url))
    return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  if (/soundcloud\.com/.test(url))
    return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  if (/tiktok\.com/.test(url))
    return `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  return null;
}

export async function POST(request: Request) {
  let body: { url?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { url } = body;
  if (!url) return err('url is required');

  const endpoint = getOembedEndpoint(url);
  if (!endpoint) return err('Unsupported URL');

  try {
    const res = await fetch(endpoint, { headers: { 'User-Agent': 'CircleApp/1.0' } });
    if (!res.ok) return err('oEmbed fetch failed');
    const data = await res.json();
    return ok({
      title: data.title ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      author_name: data.author_name ?? null,
    });
  } catch {
    return err('oEmbed fetch failed');
  }
}
