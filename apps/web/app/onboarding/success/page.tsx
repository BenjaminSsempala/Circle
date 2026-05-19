'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../auth/auth.css';

export default function SuccessPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [userLink] = useState('thecircle.co/jaytham');

  useEffect(() => {
    // Confetti animation (simple CSS-only approach)
    const canvas = document.getElementById('confetti') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#005440', '#84d6b9', '#ffdcbe', '#feb56b'];

        for (let i = 0; i < 50; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 5 + 3,
            size: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
          });
        }

        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            p.vy += 0.1; // gravity

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          });

          if (particles.some((p) => p.life > 0)) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      }
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(userLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Fixed Confetti Canvas */}
      <canvas
        id="confetti"
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-10"
      ></canvas>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-primary-container/10 px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
        <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
        <div className="text-label-mono font-label-mono bg-primary-container/10 text-primary px-3 py-1 rounded-full">
          Step 4 of 4
        </div>
      </header>

      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
        {/* Left Content: Success Messaging */}
        <div className="lg:col-span-1 flex flex-col space-y-lg animate-in">
          <div className="space-y-sm">
            <span className="text-label-mono font-label-mono text-secondary bg-secondary-fixed/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Welcome to the Circle
            </span>
            <h1 className="text-headline-xl font-headline-xl md:text-headline-xl text-primary leading-tight">
              Your profile is live!
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-md">
              Congratulations! Your professional space is ready to share with collectors and the
              East African art community.
            </p>
          </div>

          {/* URL Copy Section */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-md space-y-sm shadow-sm">
            <p className="text-caption font-caption text-on-surface-variant">Share your unique link</p>
            <div className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-sm">
              <span className="text-label-mono font-label-mono text-primary flex-grow truncate">
                {userLink}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-xs bg-primary text-on-primary px-4 py-2 rounded-lg text-label-mono font-label-mono hover:opacity-90 transition-all active:scale-95"
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="text-headline-md font-headline-md text-on-surface">What's next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg flex-shrink-0">✓</span>
                <span className="text-body-md font-body-md text-on-surface-variant">
                  Share your link on social media and with potential clients
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg flex-shrink-0">✓</span>
                <span className="text-body-md font-body-md text-on-surface-variant">
                  Complete your profile with more packages and details
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-lg flex-shrink-0">✓</span>
                <span className="text-body-md font-body-md text-on-surface-variant">
                  Start receiving bookings from your Circle
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="pt-4 space-y-3">
            <button
              onClick={() => {
                // Frontend flag - navigate to dashboard
                if (true) {
                  router.push('/dashboard');
                }
              }}
              className="w-full bg-primary text-on-primary text-body-md font-body-md px-lg py-4 rounded-lg shadow-lg shadow-primary/10 hover:opacity-90 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                // Frontend flag - allow viewing profile
                if (true) {
                  window.open(`https://thecircle.co/jaytham`, '_blank');
                }
              }}
              className="w-full border border-outline-variant text-on-surface text-body-md font-body-md px-lg py-4 rounded-lg hover:bg-surface-container-low transition-all"
            >
              View Your Profile
            </button>
          </div>
        </div>

        {/* Right Content: Visual */}
        <div className="hidden lg:flex flex-col gap-md">
          <div className="relative w-full aspect-[1/1.2] rounded-xl overflow-hidden shadow-lg">
            <img
              alt="Success celebration"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGmY7zqCFZu_YrRtzFZQEbE3O55PCHTXM9k4vq-kBWD_64YywnaFbnNUFSy3xKwZ0SirvOE2gcc4KhVCVKuYFuONvRn4YhibqOkbCUtfp2YY6g6_t3BpohjesEEE-rOhmIatvTKvyUHQNiGD6Dxc_SBNDx6YomBRxRKYkwwmr40io0xZqdrtozDN0oNc242VoMBoc137hwvKnpNRAHeR3iXtFCagGCC8K9864qtqNjTtEOSPin8RMWPaMBGHrRvA7EIbAxvRRWu6Q"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex flex-col justify-end p-md">
              <p className="text-headline-md font-headline-md text-white">You're ready.</p>
            </div>
          </div>

          <div className="bg-primary-container/5 rounded-xl p-md border border-primary-container/10">
            <p className="text-body-md font-body-md text-on-surface-variant italic">
              "Your journey on Circle has just begun. Every step you take brings you closer to
              building the creative career you deserve."
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 py-md px-margin-mobile md:px-margin-desktop text-center text-caption font-caption text-on-surface-variant opacity-70">
        <p>
          Need help? Check out our{' '}
          <Link href="#" className="text-primary hover:underline">
            guides
          </Link>{' '}
          or{' '}
          <Link href="#" className="text-primary hover:underline">
            contact support
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
