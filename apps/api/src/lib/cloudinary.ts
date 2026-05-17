export async function uploadMedia(buffer: Buffer, opts: { folder: string; resourceType: 'image' | 'video' }) {
  // Placeholder - in production you'd call Cloudinary or another storage service.
  return { url: `https://example.com/${opts.folder}/placeholder.jpg` };
}
