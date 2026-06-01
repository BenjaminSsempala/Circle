import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { ProfileClient } from './_components/ProfileClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;
  if (!artist) redirect('/dashboard');

  return (
    <div className="p-6 md:p-10 w-full">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">Edit Your Profile</h1>
      <p className="text-body-md font-body-md text-on-surface-variant mb-8">
        Your changes will update across the platform instantly.
      </p>
      <ProfileClient artist={artist} />
    </div>
  );
}
