// Module-level font cache — survives warm serverless invocations.
// On cold start fonts are fetched once and reused for the lifetime of the instance.

const cache = new Map<string, ArrayBuffer>();

export async function loadFontCached(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text());
    const match = css.match(/src: url\((.+?)\) format/);
    if (!match) return null;
    const buf = await fetch(match[1]).then((r) => r.arrayBuffer());
    if (!buf.byteLength) return null;
    cache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}
