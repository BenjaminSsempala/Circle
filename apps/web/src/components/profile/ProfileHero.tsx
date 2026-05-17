 'use client';

 import { useState } from 'react';
 import { Share2, CheckCheck } from 'lucide-react';
 import type { PublicArtist } from '@circle/types';

 export function ProfileHero({ artist }: { artist: PublicArtist }) {
   const [copied, setCopied] = useState(false);
   const profileUrl = `https://thecircle.co/${artist.slug}`;

   function copyLink() {
     if (typeof navigator !== 'undefined' && navigator.clipboard) {
       navigator.clipboard.writeText(profileUrl);
     }
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
   }

   function shareWhatsApp() {
     const text = `Check out ${artist.name} on The Circle: ${profileUrl}`;
     if (typeof window !== 'undefined') {
       window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
     }
   }

   return (
     <div className="relative h-[55vh] min-h-[380px] max-h-[560px] w-full overflow-hidden">
       {artist.featureMedia ? (
         artist.featureMedia.includes('youtube') || artist.featureMedia.includes('youtu.be') ? (
           <div className="absolute inset-0 bg-ink" />
         ) : (
           <img src={artist.featureMedia} alt="" className="absolute inset-0 w-full h-full object-cover" />
         )
       ) : (
         <div className="absolute inset-0 bg-gradient-to-br from-teal-dark via-teal to-teal-mid" />
       )}

       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

       <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 lg:px-8">
         <div className="flex flex-wrap gap-2 mb-3">
           {artist.artForms.slice(0, 3).map(f => (
             <span key={f} className="text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm bg-white/20 text-white border border-white/30">
               {f.replace(/_/g, ' ')}
             </span>
           ))}
         </div>

         <h1 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight">
           {artist.name}
           {artist.pronouns && <span className="ml-3 text-lg font-normal text-white/70">{artist.pronouns}</span>}
         </h1>

         {artist.city && <p className="text-white/70 text-sm mt-1">{artist.city}{artist.country ? `, ${artist.country}` : ''}</p>}

         {artist.tagline && <p className="text-white/90 text-lg mt-2 font-body max-w-xl">"{artist.tagline}"</p>}

         <div className="flex items-center gap-3 mt-4">
           <a href="#packages" className="bg-teal text-white font-semibold px-6 py-2.5 rounded-btn hover:bg-teal-dark transition-colors text-sm">Book {artist.name.split(' ')[0]}</a>

           <div className="relative group">
             <button onClick={copyLink} className="flex items-center gap-2 backdrop-blur-sm bg-white/20 text-white border border-white/30 font-medium px-4 py-2.5 rounded-btn hover:bg-white/30 transition-colors text-sm">
               {copied ? <CheckCheck size={15} /> : <Share2 size={15} />}
               {copied ? 'Copied!' : 'Share'}
             </button>
           </div>

           <button onClick={shareWhatsApp} className="hidden sm:flex items-center gap-2 backdrop-blur-sm bg-white/10 text-white/80 border border-white/20 font-medium px-4 py-2.5 rounded-btn hover:bg-white/20 transition-colors text-sm">
             Share on WhatsApp
           </button>
         </div>

         <div className="flex items-center gap-4 mt-3">
           {artist.completedBookings > 0 && <span className="text-white/60 text-xs">{artist.completedBookings} completed bookings</span>}
           {artist.isVerified && <span className="text-teal-mid text-xs font-medium">\u2713 Verified</span>}
           {artist.memberSince && <span className="text-white/60 text-xs">Member since {new Date(artist.memberSince).getFullYear()}</span>}
         </div>
       </div>
     </div>
   );
 }
