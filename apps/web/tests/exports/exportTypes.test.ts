import { describe, it, expect } from 'vitest';
import { extractHandleFromUrl } from '@/lib/exports/exportTypes';

// ─── extractHandleFromUrl ─────────────────────────────────────────────────────

describe('extractHandleFromUrl — youtube', () => {
  // /@handle  →  bare name (display layer re-adds @)
  it('extracts handle from /@handle URL', () => {
    expect(extractHandleFromUrl('https://youtube.com/@MusiqueArtiste', 'youtube')).toBe('MusiqueArtiste');
  });

  it('extracts handle from /@handle URL with trailing slash', () => {
    expect(extractHandleFromUrl('https://youtube.com/@MusiqueArtiste/', 'youtube')).toBe('MusiqueArtiste');
  });

  it('extracts handle from /@handle URL with sub-path', () => {
    expect(extractHandleFromUrl('https://youtube.com/@MusiqueArtiste/videos', 'youtube')).toBe('MusiqueArtiste');
  });

  // /channel/UCxxxx  →  preserve prefix so ExportModal builds valid URL
  it('preserves channel/ prefix for /channel/ URLs', () => {
    expect(extractHandleFromUrl('https://youtube.com/channel/UCxxxxYYYYZZZZ', 'youtube')).toBe('channel/UCxxxxYYYYZZZZ');
  });

  it('preserves channel/ prefix even with sub-path', () => {
    expect(extractHandleFromUrl('https://youtube.com/channel/UCxxxxYYYYZZZZ/videos', 'youtube')).toBe('channel/UCxxxxYYYYZZZZ');
  });

  // /user/name  →  preserve prefix
  it('preserves user/ prefix for /user/ URLs', () => {
    expect(extractHandleFromUrl('https://youtube.com/user/ArtistName', 'youtube')).toBe('user/ArtistName');
  });

  it('preserves user/ prefix with sub-path', () => {
    expect(extractHandleFromUrl('https://youtube.com/user/ArtistName/playlists', 'youtube')).toBe('user/ArtistName');
  });

  // /c/name  →  preserve prefix
  it('preserves c/ prefix for /c/ URLs', () => {
    expect(extractHandleFromUrl('https://youtube.com/c/ArtistName', 'youtube')).toBe('c/ArtistName');
  });

  it('preserves c/ prefix with sub-path', () => {
    expect(extractHandleFromUrl('https://youtube.com/c/ArtistName/about', 'youtube')).toBe('c/ArtistName');
  });

  // Bare path fallback (no recognised prefix)
  it('returns bare path segment as fallback', () => {
    expect(extractHandleFromUrl('https://youtube.com/SomeName', 'youtube')).toBe('SomeName');
  });

  // Input without protocol
  it('handles URL without https:// prefix', () => {
    expect(extractHandleFromUrl('youtube.com/@handle', 'youtube')).toBe('handle');
  });

  // Empty input
  it('returns empty string for empty url', () => {
    expect(extractHandleFromUrl('', 'youtube')).toBe('');
  });
});

// ─── extractHandleFromUrl — other platforms ───────────────────────────────────

describe('extractHandleFromUrl — instagram', () => {
  it('extracts username', () => {
    expect(extractHandleFromUrl('https://instagram.com/artistname', 'instagram')).toBe('artistname');
  });

  it('strips leading @ from username', () => {
    expect(extractHandleFromUrl('https://instagram.com/@artistname', 'instagram')).toBe('artistname');
  });
});

describe('extractHandleFromUrl — twitter', () => {
  it('extracts username', () => {
    expect(extractHandleFromUrl('https://twitter.com/artistname', 'twitter')).toBe('artistname');
  });

  it('strips leading @', () => {
    expect(extractHandleFromUrl('https://twitter.com/@artistname', 'twitter')).toBe('artistname');
  });
});

describe('extractHandleFromUrl — tiktok', () => {
  it('extracts handle without @', () => {
    expect(extractHandleFromUrl('https://tiktok.com/@artistname', 'tiktok')).toBe('artistname');
  });
});

describe('extractHandleFromUrl — linkedin', () => {
  it('extracts personal profile handle', () => {
    expect(extractHandleFromUrl('https://linkedin.com/in/artistname', 'linkedin')).toBe('artistname');
  });

  it('extracts company handle', () => {
    expect(extractHandleFromUrl('https://linkedin.com/company/acme-corp', 'linkedin')).toBe('acme-corp');
  });
});

describe('extractHandleFromUrl — spotify', () => {
  it('extracts artist id from artist URL', () => {
    expect(extractHandleFromUrl('https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF', 'spotify')).toBe('0OdUWJ0sBjDrqHygGUXeCF');
  });
});

describe('extractHandleFromUrl — edge cases', () => {
  it('returns empty string for empty url on any platform', () => {
    expect(extractHandleFromUrl('', 'instagram')).toBe('');
  });

  it('does not throw on a malformed url', () => {
    expect(() => extractHandleFromUrl('not a url !!', 'youtube')).not.toThrow();
  });
});
