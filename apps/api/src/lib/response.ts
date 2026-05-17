export function ok(data: any, status = 200) {
  return { ok: true, status, data } as any;
}

export function err(message: string, status = 400) {
  return { ok: false, status, error: message } as any;
}

export async function requireArtistOwnership(req: any, artistId: string) {
  // Placeholder: in real app check auth token and verify artist ownership
  return { authorized: true, userId: 'placeholder' };
}
