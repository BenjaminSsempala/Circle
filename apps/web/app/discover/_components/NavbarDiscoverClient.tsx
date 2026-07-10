// NavbarDiscoverClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  isGuest: boolean;
  isArtist: boolean;
  accountMenu: React.ReactNode;
}

export default function NavbarDiscoverClient({ isGuest, isArtist, accountMenu }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Action Toggle Button */}
          {!isGuest && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="block md:hidden text-on-surface focus:outline-none p-1"
              aria-label="Toggle Dynamic Navigation Drawer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
          
          <Link href="/" className="text-headline-md font-headline-md font-bold text-primary shrink-0">
            Engero
          </Link>
        </div>

        {/* Desktop Anchor Options View */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/discover" 
            className={`text-sm transition-colors ${pathname === '/discover' ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Explore
          </Link>
          {!isGuest && (
            <>
              <Link href="/my-circle" className={`text-sm transition-colors ${pathname === '/my-circle' ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' : 'text-on-surface-variant hover:text-primary'}`}>My Circle</Link>
              <Link href="/saved" className={`text-sm transition-colors ${pathname === '/saved' ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' : 'text-on-surface-variant hover:text-primary'}`}>Saved</Link>
              <Link href="/bookings" className={`text-sm transition-colors ${pathname === '/bookings' ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' : 'text-on-surface-variant hover:text-primary'}`}>My bookings</Link>
              {!isArtist && <Link href="/my-circle/gigs" className={`text-sm transition-colors ${pathname === '/my-circle/gigs' ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' : 'text-on-surface-variant hover:text-primary'}`}>My Gig Posts</Link>}
            </>
          )}
        </div>

        {/* Account Entry Points Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {isGuest ? (
            <>
              <Link href="/auth/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-on-primary text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Join free
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/saved" className="md:hidden text-on-surface-variant hover:text-primary transition-colors p-1" aria-label="Quick Link Saved Items">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
              {accountMenu}
            </div>
          )}
        </div>
      </div>

      {/* Alternative View Mobile Drawer Tray Dropdown */}
      {isOpen && !isGuest && (
        <div className="md:hidden border-b border-outline-variant/20 bg-surface-container px-4 py-4 flex flex-col gap-4 shadow-inner">
          <Link href="/discover" onClick={() => setIsOpen(false)} className={`text-sm py-1 transition-colors ${pathname === '/discover' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Explore</Link>
          <Link href="/my-circle" onClick={() => setIsOpen(false)} className={`text-sm py-1 transition-colors ${pathname === '/my-circle' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>My Circle</Link>
          <Link href="/saved" onClick={() => setIsOpen(false)} className={`text-sm py-1 transition-colors ${pathname === '/saved' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>Saved</Link>
          <Link href="/bookings" onClick={() => setIsOpen(false)} className={`text-sm py-1 transition-colors ${pathname === '/bookings' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>My bookings</Link>
          {!isArtist && <Link href="/my-circle/gigs" onClick={() => setIsOpen(false)} className={`text-sm py-1 transition-colors ${pathname === '/my-circle/gigs' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>My Gig Posts</Link>}
        </div>
      )}
    </nav>
  );
}