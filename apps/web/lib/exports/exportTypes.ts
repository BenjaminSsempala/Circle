// ─── Shared constants ─────────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS = ['instagram', 'twitter', 'spotify', 'youtube', 'tiktok', 'linkedin'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

// ─── EPK types ────────────────────────────────────────────────────────────────

export type ExperienceEntry = {
  year: string;
  role: string;
  org: string;
  description: string;
};

export type WorkEntry = {
  title: string;
  url: string;
  platform: string;
};

export type EPKFillable = {
  // Bio (auto-populated from profile, fully editable)
  bio: string;
  // Experience (CV-style)
  experience: ExperienceEntry[];
  // Selected works — IDs from profile to exclude
  excluded_work_ids: string[];
  // Technical rider
  technical_requirements: string;
  // Socials with @handles (auto-populated from profile, editable)
  active_socials: Record<string, boolean>;
  social_handles: Record<string, string>;
  // Contact info
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  // Packages — IDs to exclude
  excluded_package_ids: string[];
};

// ─── Rate Card types ──────────────────────────────────────────────────────────

export type StatEntry = { value: string; label: string };

export type RateCardFillable = {
  stats: StatEntry[];
  active_socials: Record<string, boolean>;
  social_handles: Record<string, string>;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  excluded_package_ids: string[];
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_EPK: EPKFillable = {
  bio: '',
  experience: [{ year: '', role: '', org: '', description: '' }],
  excluded_work_ids: [],
  technical_requirements:
    '• 1× condenser microphone on boom stand\n• 2× monitor wedges (front-fill)\n• 4-channel PA minimum, 500+ watt\n• Adjustable warm stage lighting preferred',
  active_socials: { instagram: false, twitter: false, spotify: false, youtube: false, tiktok: false, linkedin: false },
  social_handles: {},
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  excluded_package_ids: [],
};

export const DEFAULT_RATE_CARD: RateCardFillable = {
  stats: [],
  active_socials: { instagram: false, twitter: false, spotify: false, youtube: false, tiktok: false, linkedin: false },
  social_handles: {},
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  excluded_package_ids: [],
};

export const STAT_TEMPLATES = [
  'Shows performed',
  'Albums released',
  'Books written',
  'Copies sold',
  'Events hosted',
  'Years active',
  'Awards won',
  'Projects completed',
  'Countries toured',
  'Songs recorded',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractHandleFromUrl(url: string, platform: string): string {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const path = u.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (platform === 'instagram') return path.split('/')[0].replace('@', '');
    if (platform === 'twitter') return path.split('/')[0].replace('@', '');
    if (platform === 'tiktok') return path.replace('@', '').split('/')[0];
    if (platform === 'linkedin') return path.replace('in/', '').replace('company/', '').split('/')[0];
    if (platform === 'youtube') return path.replace('@', '').split('/')[0];
    if (platform === 'spotify') return path.split('/').pop() ?? path;
    return path;
  } catch {
    return url.replace(/^https?:\/\/[^/]+\//, '').replace('@', '');
  }
}

export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/spotify\.com/.test(url)) return 'spotify';
  if (/soundcloud\.com/.test(url)) return 'soundcloud';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  return url ? 'link' : '';
}
