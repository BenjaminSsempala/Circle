'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignatureBox, Btn } from './ui';

export function SignedCopyUpload({
  bookingId,
  role,
  label,
  signedUrl,
  canUpload,
}: {
  bookingId: string;
  role: 'artist' | 'audience';
  label: string;
  signedUrl: string | null;
  canUpload: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = signedUrl ? 'done' : canUpload ? 'pending' : 'waiting';
  const filename = signedUrl ? signedUrl.split('/').pop() : undefined;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('role', role);

      const res = await fetch(`/api/bookings/${bookingId}/contract/upload`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Upload failed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="flex-1">
      <SignatureBox label={label} status={status} filename={filename} href={signedUrl ?? undefined} />
      {canUpload && !signedUrl && (
        <div className="mt-2">
          <input ref={fileInput} type="file" accept="application/pdf,image/*" onChange={handleFile} className="hidden" />
          <Btn variant="tealOutline" full small disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload signed copy'}
          </Btn>
          {error && <div className="font-sans text-xs text-[#c0392b] mt-1">{error}</div>}
        </div>
      )}
    </div>
  );
}
