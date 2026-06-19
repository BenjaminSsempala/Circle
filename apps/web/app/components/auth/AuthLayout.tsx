'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showImage?: boolean;
  step?: number;
  totalSteps?: number;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showImage = false,
  step,
  totalSteps,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side: Editorial Image */}
      {showImage && (
        <section className="hidden md:flex flex-1 relative overflow-hidden bg-gradient-to-b from-primary/60 to-primary">
          <img
            alt="East African Artist"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuASsfxu0lBhBq7C2q16-LddUOIbJdzupDGAYxRgVisxCIEKHW5TM3G5WnTqrlKrUWw8cGYPEim20GLOsA2KbkRN975cy9ztjigpsn5nEvyjNOiuwhbOee0D3xngmk5ZwCg6XOV0xjJtVbY0gnEiaFzgC1a7JbLJKkZqK7zt8J6iNHHVJOo97dsEDdSOypspEDoaqjLI59ZbELQqtU3Urr6JZtIyH5y3VAkCDbVQNa88Mu9eYxNWCJbwQsadXOoDCYnCGxbrV2HbgE0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>

          {/* Branding Overlay */}
          <div className="absolute top-12 left-12 z-20">
            <h1 className="text-headline-md font-headline-md text-white tracking-tight">Circle</h1>
            <p className="text-body-md font-body-md text-primary-fixed mt-2 opacity-90 max-w-xs">
              Your professional home for your craft.
            </p>
          </div>

          {/* Quote Overlay */}
          <div className="absolute bottom-12 left-12 right-12 z-20">
            <div className="glass-effect p-8 rounded-xl border border-white/20">
              <p className="text-body-lg font-body-lg text-white italic">
                "Circle is more than a platform; it's where your art finds its audience."
              </p>
              <p className="text-label-mono font-label-mono text-secondary-fixed mt-4 uppercase tracking-widest">
               Artist, Nairobi
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Right Side: Form */}
      <section className="flex-1 flex flex-col justify-center p-margin-mobile md:px-margin-desktop lg:px-32 bg-background">
        {/* Header */}
        <div className="w-full max-w-md mx-auto mb-10">
          {step && totalSteps && (
            <div className="mb-6 text-center md:text-left">
              <p className="text-label-mono font-label-mono text-primary bg-primary-container/10 inline-block px-3 py-1 rounded-full">
                Step {step} of {totalSteps}
              </p>
            </div>
          )}

          <header className="mb-10 text-center md:text-left">
            <h2 className="text-headline-xl font-headline-xl text-primary mb-2">{title}</h2>
            {subtitle && <p className="text-body-lg font-body-lg text-on-surface-variant">{subtitle}</p>}
          </header>

          {children}
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center text-caption font-caption text-on-surface-variant max-w-md mx-auto">
          <p>
            By continuing, you agree to our{' '}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
