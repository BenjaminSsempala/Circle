// NavbarProfileClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavbarProfileClient() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/discover', label: 'Explore' },
    { href: '/my-circle', label: 'My Circle' },
    { href: '/saved', label: 'Saved' },
    { href: '/bookings', label: 'My bookings' },
    { href: '/my-circle/gigs', label: 'My Gig Posts' },
  ];

  return (
    <nav className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50 w-full">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Drawer Trigger Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="block md:hidden text-on-surface focus:outline-none p-1"
            aria-label="Toggle Desktop App Links Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          <Link href="/" className="text-headline-md font-headline-md font-bold text-primary shrink-0">
            Engero
          </Link>
        </div>

        {/* Regular Desktop Menu Layout Row */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive 
                    ? 'text-on-surface font-semibold border-b-2 border-primary pb-0.5' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        
        {/* Placeholder spacer object matching the space layout parameters */}
        <div className="w-6 md:hidden" />
      </div>

      {/* Alternative View Collapsible Menu Dropdown Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-outline-variant/20 bg-surface-container px-4 py-4 flex flex-col gap-4 shadow-inner w-full">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm py-1 transition-colors ${
                  isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}