 'use client';

 import { useState } from 'react';
 import { Clock, Truck, Star, MapPin, MessageCircle } from 'lucide-react';
 import type { PublicArtist, Package, PackageTier } from '@circle/types';
 import clsx from 'clsx';

 export function ProfileAbout({ artist }: { artist: PublicArtist }) {
   const [expanded, setExpanded] = useState(false);
   const bio      = artist.bio ?? '';
   const isLong   = bio.length > 300;
   const displayed = isLong && !expanded ? bio.slice(0, 300) + '\u2026' : bio;

   return (
     <div>
       <h2 className="font-display text-2xl font-bold text-ink mb-5">About</h2>

       <div className="space-y-4">
         <p className="text-gray-600 leading-relaxed">{displayed}</p>
         {isLong && (
           <button
             onClick={() => setExpanded(v => !v)}
             className="text-teal text-sm font-medium hover:underline"
           >
             {expanded ? 'Show less' : 'Read more'}
           </button>
         )}
       </div>

       <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-gray-500">
         {artist.city && (
           <span className="flex items-center gap-1.5">
             <MapPin size={14} className="text-gray-400" />
             {artist.city}{artist.country ? `, ${artist.country}` : ''}
           </span>
         )}
         {artist.languages && artist.languages.length > 0 && (
           <span>Performs in {artist.languages.join(', ')}</span>
         )}
         {artist.activesSince && (
           <span>Active since {artist.activesSince}</span>
         )}
       </div>

       {artist.artForms.length > 0 && (
         <div className="flex flex-wrap gap-2 mt-4">
           {artist.artForms.map(f => (
             <span
               key={f}
               className="text-xs font-medium px-3 py-1 rounded-full bg-teal-light text-teal capitalize"
             >
               {f.replace(/_/g, ' ')}
             </span>
           ))}
         </div>
       )}
     </div>
   );
 }

 const TIER_STYLES: Record<PackageTier, string> = {
   free:     'bg-gray-50 border-gray-200',
   standard: 'bg-white border-teal/30',
   premium:  'bg-teal-light border-teal/40',
 };

 const TIER_BADGE: Record<PackageTier, string> = {
   free:     'text-gray-500 bg-gray-100',
   standard: 'text-teal bg-teal-light',
   premium:  'text-teal-dark bg-teal-mid/20',
 };

 export function ProfilePackages({
   packages,
   artistName,
 }: {
   packages: Package[];
   artistName: string;
 }) {
   if (packages.length === 0) {
     return (
       <div>
         <h2 className="font-display text-2xl font-bold text-ink mb-5">Packages</h2>
         <p className="text-gray-400 text-sm">
           Contact {artistName.split(' ')[0]} directly to discuss a collaboration.
         </p>
       </div>
     );
   }

   return (
     <div>
       <h2 className="font-display text-2xl font-bold text-ink mb-6">Packages</h2>

       <div className="space-y-4">
         {packages.map(pkg => (
           <div
             key={pkg.id}
             className={clsx(
               'rounded-card border p-5 transition-shadow hover:shadow-card',
               TIER_STYLES[pkg.tier],
             )}
           >
             <div className="flex items-start justify-between gap-3 mb-3">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-display font-semibold text-ink">{pkg.name}</h3>
                   <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', TIER_BADGE[pkg.tier])}>
                     {pkg.tier}
                   </span>
                 </div>
                 <p className="text-gray-500 text-sm">{pkg.description}</p>
               </div>

               <div className="text-right flex-shrink-0">
                 <p className="font-mono font-bold text-teal text-lg">
                   {pkg.currency} {pkg.price.toLocaleString()}
                 </p>
                 {!pkg.logisticsInclusive && (
                   <p className="text-gray-400 text-xs mt-0.5">+ transport</p>
                 )}
               </div>
             </div>

             <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
               <span className="flex items-center gap-1">
                 <Clock size={12} /> {pkg.duration}
               </span>
               {pkg.logisticsInclusive && (
                 <span className="flex items-center gap-1 text-teal">
                   <Truck size={12} /> Transport included
                 </span>
               )}
             </div>

             {pkg.includedItems.length > 0 && (
               <ul className="space-y-1 mb-4">
                 {pkg.includedItems.map(item => (
                   <li key={item.id} className="text-sm text-gray-600 flex items-start gap-2">
                     <span className="text-teal mt-0.5">\u2713</span>
                     {item.text}
                   </li>
                 ))}
               </ul>
             )}

             <button className="w-full bg-teal text-white font-semibold py-2.5 rounded-btn hover:bg-teal-dark transition-colors text-sm mt-1">
               Book this package
             </button>
           </div>
         ))}
       </div>

       <div className="mt-4 text-center">
         <a
           href="#"
           className="text-sm text-gray-400 hover:text-teal transition-colors underline underline-offset-2"
         >
           Download rate card PDF
         </a>
       </div>
     </div>
   );
 }

 export function ProfileContact({ artist }: { artist: PublicArtist }) {
   return (
     <div>
       <h2 className="font-display text-2xl font-bold text-ink mb-5">
         Work with {artist.name.split(' ')[0]}
       </h2>

       <div className="space-y-3">
         <a
           href="#packages"
           className="flex items-center justify-center gap-2 w-full bg-teal text-white font-semibold py-3 rounded-btn hover:bg-teal-dark transition-colors"
         >
           Book {artist.name.split(' ')[0]}
         </a>

         <button className="flex items-center justify-center gap-2 w-full border border-gray-200 text-ink font-medium py-3 rounded-btn hover:border-teal hover:text-teal transition-colors">
           <MessageCircle size={16} />
           Send a message
         </button>
       </div>

       {artist.city && (
         <p className="text-center text-gray-400 text-sm mt-4">
           Based in {artist.city}{artist.country ? `, ${artist.country}` : ''}
         </p>
       )}

       <div className="mt-12 pt-6 border-t border-gray-100 text-center">
         <p className="text-xs text-gray-300">
           Powered by{' '}
           <a href="/" className="text-teal hover:underline font-medium">
             The Circle
           </a>
         </p>
         <p className="text-xs text-gray-300 mt-1">
           Are you an artist?{' '}
           <a href="/join" className="text-teal hover:underline">
             Join The Circle
           </a>
         </p>
       </div>
     </div>
   );
 }
