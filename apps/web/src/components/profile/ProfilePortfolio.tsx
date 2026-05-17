 'use client';

 import { useState } from 'react';
 import { Play, Music, Image as ImageIcon, X } from 'lucide-react';
 import type { PublicArtist, MediaItem, MediaSource } from '@circle/types';
 import clsx from 'clsx';

 export function ProfilePortfolio({ artist }: { artist: PublicArtist }) {
   const [filter, setFilter]           = useState<'all' | MediaSource>('all');
   const [lightboxMedia, setLightbox]  = useState<MediaItem | null>(null);
   const [writtenOpen, setWrittenOpen] = useState<MediaItem | null>(null);

   const { mediaItems } = artist;
   const activeSources = [...new Set(mediaItems.map(m => m.source))];
   const filtered = filter === 'all' ? mediaItems : mediaItems.filter(m => m.source === filter);

   const videos  = filtered.filter(m => m.type === 'video');
   const audio   = filtered.filter(m => m.type === 'audio');
   const written = filtered.filter(m => m.type === 'written');
   const photos  = filtered.filter(m => m.type === 'image');

   if (mediaItems.length === 0) {
     return (
       <div>
         <h2 className="font-display text-2xl font-bold text-ink mb-6">Portfolio</h2>
         <p className="text-gray-400 text-sm">{artist.name.split(' ')[0]} is just getting started. Check back soon.</p>
       </div>
     );
   }

   return (
     <div>
       <h2 className="font-display text-2xl font-bold text-ink mb-6">Portfolio</h2>

       {activeSources.length > 1 && (
         <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
           <button onClick={() => setFilter('all')} className={clsx('text-sm font-medium px-4 py-1.5 rounded-full', filter==='all' ? 'bg-teal text-white' : 'bg-white text-gray-500')}>All</button>
           {activeSources.map(src => (
             <button key={src} onClick={() => setFilter(src as MediaSource)} className={clsx('text-sm font-medium px-4 py-1.5 rounded-full', filter===src ? 'bg-teal text-white' : 'bg-white text-gray-500')}>{src}</button>
           ))}
         </div>
       )}

       <div className="space-y-12">
         {videos.length > 0 && (
           <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Videos</h3>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
               {videos.map(item => (
                 <button key={item.id} onClick={() => setLightbox(item)} className="relative group w-full aspect-video rounded-card overflow-hidden bg-gray-100">
                   {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-teal-light" />}
                   <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                     <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                       <Play size={18} className="text-teal ml-0.5" fill="currentColor" />
                     </div>
                   </div>
                 </button>
               ))}
             </div>
           </div>
         )}

         {audio.length > 0 && (
           <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Audio</h3>
             <div className="space-y-2">
               {audio.map(item => (
                 <div key={item.id} className="flex items-center gap-3 p-3 rounded-card bg-white border border-gray-100">
                   <div className="w-12 h-12 rounded-lg bg-teal-light flex-shrink-0 overflow-hidden">{item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-teal" /></div>}</div>
                   <div className="flex-1 min-w-0"><p className="font-medium text-ink text-sm truncate">{item.title}</p><p className="text-xs text-gray-400">{item.source}</p></div>
                   <a href={item.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-teal flex items-center justify-center"><Play size={14} className="text-white" /></a>
                 </div>
               ))}
             </div>
           </div>
         )}

         {written.length > 0 && (
           <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Written Work</h3>
             <div className="space-y-1">
               {written.map(item => (
                 <button key={item.id} onClick={() => setWrittenOpen(item)} className="w-full text-left p-4 rounded-card hover:bg-white hover:shadow-card transition-all border border-transparent hover:border-gray-100">
                   <p className="font-display font-semibold text-ink">{item.title}</p>
                   {item.excerpt && <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{item.excerpt}</p>}
                 </button>
               ))}
             </div>
           </div>
         )}

         {photos.length > 0 && (
           <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Photos</h3>
             <div className="columns-2 lg:columns-3 gap-3 space-y-3">
               {photos.map(item => (
                 <button key={item.id} onClick={() => setLightbox(item)} className="block w-full break-inside-avoid rounded-card overflow-hidden group mb-3">
                   <div className="relative"><img src={item.url} alt={item.caption ?? item.title} className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"/></div>
                 </button>
               ))}
             </div>
           </div>
         )}
       </div>

       {lightboxMedia && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setLightbox(null)}>
           <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white" onClick={() => setLightbox(null)}><X size={18} /></button>
           <div className="w-full max-w-3xl mx-auto" onClick={e => e.stopPropagation()}>
             {lightboxMedia.type === 'video' ? (
               <div className="aspect-video bg-black rounded-card overflow-hidden">
                 {lightboxMedia.source === 'youtube' ? <iframe src={`https://www.youtube.com/embed/${new URL(lightboxMedia.url).searchParams.get('v')}`} className="w-full h-full" allow="autoplay; encrypted-media" /> : <video src={lightboxMedia.url} controls autoPlay className="w-full h-full" />}
               </div>
             ) : (
               <img src={lightboxMedia.url} alt={lightboxMedia.title} className="w-full rounded-card object-contain max-h-[70vh]" />
             )}
           </div>
         </div>
       )}

       {writtenOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mist/95" onClick={() => setWrittenOpen(null)}>
           <div className="max-w-xl mx-auto px-6 py-8 bg-white rounded-card" onClick={e => e.stopPropagation()}>
             <h2 className="font-display text-2xl font-bold text-ink mb-2">{writtenOpen.title}</h2>
             <p className="font-body text-lg text-ink leading-[1.9] whitespace-pre-wrap">{writtenOpen.excerpt ?? writtenOpen.url}</p>
           </div>
         </div>
       )}
     </div>
   );
 }
