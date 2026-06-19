export const dynamic = 'force-dynamic';
import { ok, err } from '@/lib/api';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Strip query params from TikTok URLs: oEmbed returns 400 with tracking params
function cleanTikTokUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

function getOembedEndpoint(url: string): string | null {
  if (/youtube\.com|youtu\.be/.test(url))
    return `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  if (/open\.spotify\.com/.test(url))
    return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  if (/soundcloud\.com/.test(url))
    return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  if (/tiktok\.com/.test(url))
    return `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanTikTokUrl(url))}`;
  return null;
}

// Upload an image URL to Cloudinary permanently (not fetch proxy: those re-fetch expired URLs)
async function uploadToCloudinary(imageUrl: string): Promise<string | null> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return null;
  try {
    const form = new FormData();
    form.append('file', imageUrl);
    form.append('upload_preset', preset);
    form.append('folder', 'thumbnails');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.secure_url as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: { url?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { url } = body;
  if (!url) return err('url is required');

  const endpoint = getOembedEndpoint(url);
  if (!endpoint) return err('Unsupported URL');

  try {
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept': 'application/json' },
    });
    if (!res.ok) return err('oEmbed fetch failed');
    const data = await res.json();

    let thumbnail_url: string | null = data.thumbnail_url ?? null;
    let title: string | null = data.title ?? null;

    if (/tiktok\.com/.test(url)) {
      // TikTok titles are the full caption: truncate before first hashtag or newline
      if (title) {
        title = title.split('#')[0].split('\n')[0].trim();
        if (title.length > 80) title = title.slice(0, 80).trimEnd() + '…';
      }
      // TikTok thumbnails are signed and expire: upload to Cloudinary immediately
      if (thumbnail_url) {
        const permanent = await uploadToCloudinary(thumbnail_url);
        if (permanent) thumbnail_url = permanent;
      }
    }

    return ok({
      title,
      thumbnail_url,
      author_name: data.author_name ?? null,
    });
  } catch {
    return err('oEmbed fetch failed');
  }
}
