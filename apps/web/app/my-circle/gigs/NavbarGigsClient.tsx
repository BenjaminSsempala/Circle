// NavbarGigsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  onPostClick: () => void;
  accountMenu: React.ReactNode;
}

export default function NavbarGigsClient({ onPostClick, accountMenu }: NavbarProps) {
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
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-outline-variant/30 w-full">
      <nav className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 h-16 max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Drawer toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="block md:hidden text-on-surface focus:outline-none p-1"
            aria-label="Toggle Desktop Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="text-base sm:text-lg font-bold text-primary shrink-0">
            Engero
          </Link>
          
          {/* Desktop Links Row */}
          <div className="hidden md:flex gap-6">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors pb-0.5 ${
                    isActive
                      ? 'text-primary font-semibold border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Context & Action Cluster */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPostClick}
            className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity"
          >
            + <span className="hidden xs:inline">Post a gig</span><span className="xs:hidden">Post</span>
          </button>
          {accountMenu}
        </div>
      </nav>

      {/* Dropdown Mobile Drawer Panel */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-outline-variant/20 px-4 py-4 flex flex-col gap-4 shadow-inner w-full">
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
    </header>
  );
}