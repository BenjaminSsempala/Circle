'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../auth/auth.css';

export default function DashboardPage() {
  const router = useRouter();
  const userEmail = typeof window !== 'undefined' ? sessionStorage.getItem('userEmail') : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-outline-variant/30 px-margin-mobile md:px-margin-desktop py-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-headline-md font-headline-md text-primary tracking-tight">Circle</div>
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push('/');
            }}
            className="text-body-md font-body-md text-on-surface hover:text-primary transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        <div className="space-y-lg">
          <div>
            <h1 className="text-headline-xl font-headline-xl text-on-surface mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant">
              {userEmail ? `Logged in as ${userEmail}` : 'Your Circle dashboard'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-lg">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-3">Profile</h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-4">
                View and edit your profile
              </p>
              <Link
                href="#"
                className="inline-block bg-primary text-on-primary px-lg py-3 rounded-lg text-body-md font-body-md hover:opacity-90 transition-all"
              >
                Edit Profile
              </Link>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-lg">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-3">Packages</h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-4">
                Manage your service offerings
              </p>
              <Link
                href="#"
                className="inline-block bg-primary text-on-primary px-lg py-3 rounded-lg text-body-md font-body-md hover:opacity-90 transition-all"
              >
                Manage Packages
              </Link>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-lg">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-3">Bookings</h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-4">
                View your upcoming bookings
              </p>
              <Link
                href="#"
                className="inline-block bg-primary text-on-primary px-lg py-3 rounded-lg text-body-md font-body-md hover:opacity-90 transition-all"
              >
                View Bookings
              </Link>
            </div>
          </div>

          {/* Demo Navigation */}
          <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-lg">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-4">Frontend Demo</h3>
            <p className="text-body-md font-body-md text-on-surface-variant mb-4">
              Test the auth and onboarding flows:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="bg-surface text-on-surface border border-outline-variant px-lg py-2 rounded-lg hover:bg-surface-container-low transition-all text-body-md font-body-md"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-surface text-on-surface border border-outline-variant px-lg py-2 rounded-lg hover:bg-surface-container-low transition-all text-body-md font-body-md"
              >
                Signup
              </Link>
              <Link
                href="/onboarding/artist"
                className="bg-surface text-on-surface border border-outline-variant px-lg py-2 rounded-lg hover:bg-surface-container-low transition-all text-body-md font-body-md"
              >
                Onboarding
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
