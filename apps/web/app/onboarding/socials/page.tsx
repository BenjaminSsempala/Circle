'use client';

import { useState, useEffect, type JSX } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import '../../auth/auth.css';

// ─── Brand SVG logos ──────────────────────────────────────────────────────────

const YouTubeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF0000">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);

const SpotifyLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1DB954">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const TwitterLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WebsiteLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SoundCloudLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF5500">
    <path d="M1.175 12.225c-.015 0-.019.008-.019.023l.188 2.328-.188 2.167c0 .015.004.022.019.022.011 0 .015-.007.019-.022l.222-2.167-.222-2.328c-.004-.015-.008-.023-.019-.023zm.79-.5c-.019 0-.023.008-.027.027l-.166 2.824.166 2.49c.004.019.008.027.027.027s.027-.008.031-.027l.19-2.49-.19-2.824c-.004-.019-.012-.027-.031-.027zm.843-.274c-.023 0-.027.008-.031.031l-.144 3.098.144 2.46c.004.023.008.031.031.031s.027-.008.035-.031l.163-2.46-.163-3.098c-.008-.023-.012-.031-.035-.031zm.82-.197c-.027 0-.031.008-.035.035l-.121 3.295.121 2.427c.004.027.008.035.035.035.023 0 .031-.008.035-.035l.14-2.427-.14-3.295c-.004-.027-.012-.035-.035-.035zm.831-.098c-.031 0-.039.012-.039.039l-.098 3.393.098 2.394c0 .027.008.039.039.039s.039-.012.039-.039l.113-2.394-.113-3.393c0-.027-.008-.039-.039-.039zm.835-.051c-.035 0-.047.016-.047.047l-.074 3.444.074 2.362c0 .031.012.047.047.047.031 0 .047-.016.047-.047l.086-2.362-.086-3.444c0-.031-.016-.047-.047-.047zm.847-.027c-.039 0-.055.02-.055.055l-.051 3.471.051 2.331c0 .035.016.055.055.055.035 0 .055-.02.055-.055l.059-2.331-.059-3.471c0-.035-.02-.055-.055-.055zm.855-.012c-.043 0-.063.024-.063.063l-.027 3.483.027 2.3c0 .039.02.063.063.063.039 0 .063-.024.063-.063l.031-2.3-.031-3.483c0-.039-.024-.063-.063-.063zm.863 0c-.047 0-.07.028-.07.07v.004l-.004 3.413.004 2.27c0 .043.024.07.07.07s.07-.028.07-.07l.004-2.27-.004-3.413c0-.043-.024-.07-.07-.07h-.004zm2.347-1.218c-.188 0-.371.031-.543.086-.114-2.59-2.344-4.656-5.07-4.656-.63 0-1.231.118-1.779.332-.207.079-.261.161-.266.238v9.135c.005.079.066.142.147.149h7.511c.465 0 .843-.378.843-.843V11.65c0-.465-.378-.843-.843-.843z" />
  </svg>
);

// ─── URL parsing helpers ──────────────────────────────────────────────────────

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function buildSpotifyEmbedUrl(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
}

function buildSoundCloudEmbedUrl(url: string): string | null {
  if (!url.includes('soundcloud.com')) return null;
  const params = new URLSearchParams({
    url,
    color: '#FF5500',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

function extractHandle(url: string, platform: 'instagram' | 'tiktok'): string | null {
  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com\/([a-zA-Z0-9._]+)/,
    tiktok: /tiktok\.com\/@([a-zA-Z0-9._]+)/,
  };
  const m = url.match(patterns[platform]);
  return m ? m[1] : null;
}

function extractTwitterHandle(url: string): string | null {
  const m = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
  return m ? m[1] : null;
}

function extractLinkedInHandle(url: string): string | null {
  // Matches /in/username or /company/name
  const m = url.match(/linkedin\.com\/(in|company)\/([a-zA-Z0-9._-]+)/);
  if (!m) return null;
  return m[1] === 'company' ? m[2] : m[2];
}

function isLinkedInCompany(url: string): boolean {
  return /linkedin\.com\/company\//.test(url);
}

// ─── Functional platform previews ────────────────────────────────────────────

function YouTubePreview({ url }: { url: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [fetchDone, setFetchDone] = useState(false);
  const videoId = extractYouTubeVideoId(url);

  useEffect(() => {
    if (!url) return;
    setFetchDone(false);

    if (videoId) {
      // Direct thumbnail: no API key needed
      setThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    }

    // Fetch title (and channel thumbnail if no video ID) via noembed
    fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.title) setTitle(d.title);
        if (!videoId && d.thumbnail_url) setThumbnail(d.thumbnail_url);
      })
      .catch(() => {})
      .finally(() => setFetchDone(true));
  }, [url, videoId]);

  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 relative" style={{ aspectRatio: '16/9' }}>
      {thumbnail ? (
        <img src={thumbnail} alt={title || 'YouTube'} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
          {!fetchDone && (
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg opacity-90 hover:opacity-100 transition-opacity">
          <span className="text-white text-sm ml-0.5">▶</span>
        </div>
      </div>
      {/* Title bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-xs font-medium truncate">
          {title || (videoId ? 'Watch on YouTube' : 'View channel')}
        </p>
      </div>
    </div>
  );
}

function SpotifyPreview({ url }: { url: string }) {
  const embedUrl = buildSpotifyEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="rounded-lg bg-[#121212] p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]">
        <SpotifyLogo />
        <p className="text-gray-400 text-xs text-center">
          Paste a Spotify artist, album or track URL to see a preview
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        style={{ border: 'none' }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify preview"
      />
    </div>
  );
}

function TikTokPreview({ url }: { url: string }) {
  const handle = extractHandle(url, 'tiktok');

  return (
    <div className="rounded-lg overflow-hidden relative" style={{ minHeight: '148px', background: '#010101' }}>
      {/* Subtle teal + pink glow blobs */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: '#69C9D0' }} />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: '#EE1D52' }} />

      <div className="relative flex items-center gap-4 p-4 h-full">
        {/* Avatar placeholder with TikTok logo */}
        <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10"
          style={{ background: 'linear-gradient(135deg, #69C9D0 0%, #010101 50%, #EE1D52 100%)' }}>
          <TikTokLogo />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base leading-tight truncate">
            {handle ? `@${handle}` : 'Your TikTok'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {/* TikTok wordmark colours: teal shadow + pink shadow */}
            <span className="text-xs font-semibold" style={{ color: '#69C9D0' }}>Tik</span>
            <span className="text-xs font-semibold text-white -ml-0.5">Tok</span>
            <span className="text-gray-600 text-xs ml-1">· Profile</span>
          </div>
        </div>

        {/* External link icon */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

function InstagramPreview({ url }: { url: string }) {
  const handle = extractHandle(url, 'instagram');

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ minHeight: '148px', background: 'linear-gradient(135deg, #1a0a0a 0%, #1a0510 60%, #0d0008 100%)' }}
    >
      {/* IG gradient glow blobs */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-25 blur-2xl"
        style={{ background: '#f09433' }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-25 blur-2xl"
        style={{ background: '#bc1888' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-15 blur-2xl"
        style={{ background: '#dc2743' }} />

      <div className="relative flex items-center gap-4 p-4 h-full">
        {/* Avatar placeholder with IG gradient ring */}
        <div className="w-14 h-14 rounded-full flex-shrink-0 p-[2px]"
          style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
          <div className="w-full h-full rounded-full bg-[#1a0a0a] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base leading-tight truncate">
            {handle ? `@${handle}` : 'Your Instagram'}
          </p>
          <div className="mt-1">
            <span
              className="text-xs font-semibold"
              style={{ background: 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Instagram
            </span>
            <span className="text-gray-600 text-xs"> · Profile</span>
          </div>
        </div>

        {/* External link icon */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

function TwitterPreview({ url }: { url: string }) {
  const handle = extractTwitterHandle(url);

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ minHeight: '148px', background: '#000000' }}
    >
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 blur-2xl" style={{ background: '#ffffff' }} />

      <div className="relative flex items-center gap-4 p-4 h-full">
        <div className="w-14 h-14 rounded-full flex-shrink-0 bg-white/10 border border-white/20 flex items-center justify-center text-white">
          <TwitterLogo />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base leading-tight truncate">
            {handle ? `@${handle}` : 'Your X / Twitter'}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs font-semibold text-white/70">X (Twitter)</span>
            <span className="text-gray-600 text-xs">· Profile</span>
          </div>
        </div>

        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

function WebsitePreview({ url }: { url: string }) {
  let display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!display) display = 'yourwebsite.com';

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ minHeight: '148px', background: 'linear-gradient(135deg, #003d2e 0%, #005440 100%)' }}
    >
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-20 blur-2xl" style={{ background: '#feb56b' }} />
      <div className="relative flex items-center gap-4 p-4 h-full">
        <div className="w-14 h-14 rounded-full flex-shrink-0 bg-white/10 border border-white/20 flex items-center justify-center text-white">
          <WebsiteLogo />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base leading-tight truncate">{display}</p>
          <p className="text-white/60 text-xs mt-1">Personal Website</p>
        </div>
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

function LinkedInPreview({ url }: { url: string }) {
  const handle = extractLinkedInHandle(url);
  const isCompany = isLinkedInCompany(url);

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{ minHeight: '148px', background: 'linear-gradient(135deg, #00001a 0%, #001533 60%, #00264d 100%)' }}
    >
      {/* LinkedIn blue glow blobs */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-30 blur-2xl"
        style={{ background: '#0A66C2' }} />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ background: '#378FE9' }} />

      <div className="relative flex items-center gap-4 p-4 h-full">
        {/* Avatar placeholder with LinkedIn blue ring */}
        <div className="w-14 h-14 rounded-xl flex-shrink-0 p-[2px]"
          style={{ background: 'linear-gradient(135deg, #0A66C2, #378FE9)' }}>
          <div className="w-full h-full rounded-[10px] bg-[#001533] flex items-center justify-center">
            <LinkedInLogo />
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-base leading-tight truncate">
            {handle ? handle : (isCompany ? 'Your Company' : 'Your Profile')}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs font-semibold" style={{ color: '#378FE9' }}>
              LinkedIn
            </span>
            <span className="text-gray-500 text-xs">· {isCompany ? 'Company' : 'Profile'}</span>
          </div>
        </div>

        {/* External link icon */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  );
}

function SoundCloudPreview({ url }: { url: string }) {
  const embedUrl = buildSoundCloudEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="rounded-lg bg-gray-900 p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]">
        <SoundCloudLogo />
        <p className="text-gray-400 text-xs text-center">
          Paste your SoundCloud profile or track URL
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="120"
        src={embedUrl}
        style={{ border: 'none' }}
        allow="autoplay"
        loading="lazy"
        title="SoundCloud preview"
      />
    </div>
  );
}

// ─── Platform config ──────────────────────────────────────────────────────────

type PlatformKey = 'youtube' | 'spotify' | 'tiktok' | 'instagram' | 'soundcloud' | 'linkedin' | 'twitter' | 'website';

const PLATFORMS: {
  key: PlatformKey;
  name: string;
  category: string;
  Logo: () => JSX.Element;
  bgColor: string;
  description: string;
  placeholder: string;
  Preview: ({ url }: { url: string }) => JSX.Element;
}[] = [
  {
    key: 'youtube',
    name: 'YouTube',
    category: 'Video Content',
    Logo: YouTubeLogo,
    bgColor: '#FF000015',
    description: 'Import your music videos, interviews, and visual performances directly to your gallery.',
    placeholder: 'https://youtube.com/@yourname',
    Preview: YouTubePreview,
  },
  {
    key: 'spotify',
    name: 'Spotify',
    category: 'Streaming',
    Logo: SpotifyLogo,
    bgColor: '#1DB95415',
    description: 'Sync your discography and latest releases. Let clients listen while they browse your profile.',
    placeholder: 'https://open.spotify.com/artist/...',
    Preview: SpotifyPreview,
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    category: 'Short Form',
    Logo: TikTokLogo,
    bgColor: '#01010115',
    description: 'Share your creative process and viral moments. Perfect for showcasing your rhythm and energy.',
    placeholder: 'https://tiktok.com/@yourname',
    Preview: TikTokPreview,
  },
  {
    key: 'instagram',
    name: 'Instagram',
    category: 'Visual Portfolio',
    Logo: InstagramLogo,
    bgColor: '#dc274315',
    description: 'Showcase your behind-the-scenes, event photos, and visual art to your future clients.',
    placeholder: 'https://instagram.com/yourname',
    Preview: InstagramPreview,
  },
  {
    key: 'soundcloud',
    name: 'SoundCloud',
    category: 'Audio',
    Logo: SoundCloudLogo,
    bgColor: '#FF550015',
    description: 'Your audio collection, demos, and original tracks: all surfaced on your profile.',
    placeholder: 'https://soundcloud.com/yourname',
    Preview: SoundCloudPreview,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    category: 'Professional',
    Logo: LinkedInLogo,
    bgColor: '#0A66C215',
    description: 'Connect your professional profile so clients can see your credentials and experience.',
    placeholder: 'https://linkedin.com/in/yourname',
    Preview: LinkedInPreview,
  },
  {
    key: 'twitter',
    name: 'X / Twitter',
    category: 'Social',
    Logo: TwitterLogo,
    bgColor: '#ffffff10',
    description: 'Share your thoughts, announcements, and connect with fans and industry on X.',
    placeholder: 'https://x.com/yourname',
    Preview: TwitterPreview,
  },
  {
    key: 'website',
    name: 'Website',
    category: 'Personal',
    Logo: WebsiteLogo,
    bgColor: '#00544015',
    description: 'Link your personal website, portfolio, or any other page you want clients to visit.',
    placeholder: 'https://yourwebsite.com',
    Preview: WebsitePreview,
  },
];

// ─── Icons ───────────────────────────────────────────────────────────────────

function CheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

// ─── Platform card ────────────────────────────────────────────────────────────

type CardState = 'idle' | 'editing' | 'connected';

function PlatformCard({
  platform,
  state,
  url,
  onStartEditing,
  onUrlChange,
  onSave,
  onCancel,
}: {
  platform: (typeof PLATFORMS)[number];
  state: CardState;
  url: string;
  onStartEditing: () => void;
  onUrlChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isConnected = state === 'connected';
  const isEditing = state === 'editing';

  // Resolve the URL to open: ensure it's absolute
  const openUrl = url.startsWith('http') ? url : url ? `https://${url}` : '#';

  const handleCardClick = () => {
    if (isConnected && url) window.open(openUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={isConnected ? handleCardClick : undefined}
      className={`bg-surface-container-lowest rounded-xl p-md border flex flex-col transition-all duration-300 relative ${
        isConnected
          ? 'border-primary shadow-[0_4px_24px_-2px_rgba(0,84,64,0.15)] cursor-pointer group'
          : 'border-outline-variant/30 shadow-[0_4px_20px_-2px_rgba(15,110,86,0.05)] hover:-translate-y-1'
      }`}
    >
      {/* Header: logo + category label / edit button */}
      <div className="flex items-center justify-between mb-6">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: platform.bgColor }}
        >
          <platform.Logo />
        </div>

        {isConnected ? (
          /* Pencil edit button: stops propagation so it doesn't open the URL */
          <button
            onClick={(e) => { e.stopPropagation(); onStartEditing(); }}
            title="Edit link"
            className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
          >
            <PencilIcon />
            <span className="text-caption font-caption">Edit</span>
          </button>
        ) : (
          <span className="text-caption font-caption text-outline tracking-wide">
            {platform.category}
          </span>
        )}
      </div>

      {/* Name + description */}
      <h3 className="text-headline-md font-headline-md text-on-surface mb-2">{platform.name}</h3>
      <p className="text-body-md font-body-md text-on-surface-variant text-sm mb-6">
        {platform.description}
      </p>

      {/* Content area */}
      <div className="flex-1 mb-6">
        {isConnected && <platform.Preview url={url} />}
        {isEditing && (
          <div
            className="flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()} // don't trigger card click
          >
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={platform.placeholder}
              className="w-full text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && url.trim() && onSave()}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={!url.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {state === 'idle' && <div className="min-h-[40px]" />}
      </div>

      {/* CTA button */}
      {isConnected ? (
        /* Connected button is part of the clickable card: no separate onClick needed */
        <div
          onClick={(e) => e.stopPropagation()} // let card handle it
          className="w-full py-3 px-4 bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 group-hover:opacity-90 transition-opacity"
        >
          <CheckCircle />
          <span>Connected</span>
        </div>
      ) : (
        <button
          onClick={onStartEditing}
          className="mt-auto w-full py-3 px-4 bg-surface border border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-colors duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          Connect
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SocialsOnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [cardStates, setCardStates] = useState<Record<PlatformKey, CardState>>({
    youtube: 'idle', spotify: 'idle', tiktok: 'idle', instagram: 'idle', soundcloud: 'idle', linkedin: 'idle', twitter: 'idle', website: 'idle',
  });
  const [links, setLinks] = useState<Record<PlatformKey, string>>({
    youtube: '', spotify: '', tiktok: '', instagram: '', soundcloud: '', linkedin: '', twitter: '', website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth/signup'); return; }
    if (user.onboarding_complete) { router.push('/dashboard'); return; }
    if (user.role === 'organiser') { router.push('/onboarding/organiser'); return; }
  }, [user, loading, router]);

  // ── Resume: pre-fill any previously saved links ─────────────────────────
  useEffect(() => {
    if (loading || !user) return;
    fetch('/api/onboarding/artist')
      .then((r) => r.json())
      .then(({ artist }) => {
        if (!artist?.social_links || typeof artist.social_links !== 'object') return;
        const sl = artist.social_links as Record<string, string>;
        setLinks((prev) => {
          const next = { ...prev };
          setCardStates((prevStates) => {
            const nextStates = { ...prevStates };
            (Object.keys(sl) as PlatformKey[]).forEach((k) => {
              if (sl[k]?.trim()) {
                next[k] = sl[k];
                nextStates[k] = 'connected';
              }
            });
            return nextStates;
          });
          return next;
        });
      })
      .catch(() => {});
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Card actions ────────────────────────────────────────────────────────
  const startEditing = (key: PlatformKey) =>
    setCardStates((prev) => ({ ...prev, [key]: 'editing' }));

  const saveLink = (key: PlatformKey) => {
    if (!links[key].trim()) return;
    setCardStates((prev) => ({ ...prev, [key]: 'connected' }));
  };

  const cancelEditing = (key: PlatformKey) =>
    setCardStates((prev) => ({ ...prev, [key]: links[key].trim() ? 'connected' : 'idle' }));

  const connectedCount = Object.values(cardStates).filter((s) => s === 'connected').length;
  const allConnected = connectedCount === PLATFORMS.length;

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSave = async (skip = false) => {
    setApiError('');
    setSubmitting(true);
    const socialLinks = skip
      ? {}
      : Object.fromEntries(
          (Object.entries(links) as [PlatformKey, string][]).filter(([, v]) => v.trim())
        );
    try {
      const res = await fetch('/api/onboarding/socials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || 'Something went wrong.'); return; }
      router.push('/onboarding/success');
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render guards ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-body-lg font-body-lg text-on-surface-variant">Loading...</div>
      </div>
    );
  }
  if (!user || user.onboarding_complete || (user.role && user.role !== 'artist')) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed top-1/2 left-0 -translate-y-1/2 -z-10 opacity-10 pointer-events-none blur-3xl">
        <div className="w-[500px] h-[500px] bg-primary rounded-full" />
      </div>
      <div className="fixed bottom-0 right-0 -z-10 opacity-10 pointer-events-none blur-3xl">
        <div className="w-[400px] h-[400px] bg-secondary-container rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full py-6 px-margin-mobile md:px-margin-desktop flex justify-between items-center">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-label-mono font-label-mono">
          Step 3 of 3
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop pt-4 pb-xl flex flex-col items-center">
        {/* Progress bar */}
        <div className="w-full max-w-2xl mb-12">
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container transition-all duration-700" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-headline-xl font-headline-xl text-on-surface mb-4">Connect Platforms</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">
            Bringing your digital presence into one place. Connecting a platform brings your
            profile to life with your actual work.
          </p>
        </div>

        {/* Error banner */}
        {apiError && (
          <div className="w-full max-w-5xl mb-6 rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
            {apiError}
          </div>
        )}

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full max-w-5xl mb-16">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              state={cardStates[platform.key]}
              url={links[platform.key]}
              onStartEditing={() => startEditing(platform.key)}
              onUrlChange={(v) => setLinks((prev) => ({ ...prev, [platform.key]: v }))}
              onSave={() => saveLink(platform.key)}
              onCancel={() => cancelEditing(platform.key)}
            />
          ))}
        </div>

        {/* Nudge + actions */}
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <div className="bg-secondary-fixed/30 p-4 rounded-xl flex items-start gap-4 border border-secondary-fixed-dim/20 w-full">
            <span className="text-secondary text-lg pt-0.5 flex-shrink-0">✦</span>
            <p className="text-body-md font-body-md text-on-secondary-container">
              {allConnected ? (
                <>All platforms connected! Profiles with a complete presence see <strong>3× more engagement</strong> from booking agents.</>
              ) : connectedCount > 0 ? (
                <>Good start! Profiles with connected platforms see <strong>3× more engagement</strong> from booking agents.</>
              ) : (
                <>Profiles with connected platforms see <strong>3× more engagement</strong> from booking agents.</>
              )}
            </p>
          </div>

          <div className="flex flex-col w-full gap-4">
            <button
              onClick={() => handleSave(connectedCount === 0)}
              disabled={submitting}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {submitting ? 'Saving...' : connectedCount > 0 ? 'Continue' : 'Skip for now'}
            </button>
            {connectedCount > 0 && (
              <button
                onClick={() => handleSave(true)}
                className="w-full py-2 text-on-surface-variant font-medium hover:text-primary transition-colors text-center text-sm"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
