'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OAuthButton } from '../../components/auth/AuthComponents';
import '../auth.css'; 

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    termsAccepted: false,
  });
  const [step, setStep] = useState<'auth' | 'role'>('auth');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend-only validation
    if (!formData.name || !formData.email || !formData.password || !formData.termsAccepted) {
      alert('Please fill all fields and accept terms');
      return;
    }

    // Simulate API call - if true, skip wait and progress
    if (true) {
      // Bypass API, go to role selection
      setStep('role');
    }
  };

  const handleRoleSelect = (role: 'artist' | 'organiser') => {
    // Store role and redirect to appropriate onboarding
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userEmail', formData.email);

    // Frontend flag - immediate progression without API
    if (true) {
      router.push('/onboarding/artist');
    }
  };

  return (
    <AuthLayout
      title={step === 'auth' ? 'Join the Circle' : 'What brings you here?'}
      subtitle={
        step === 'auth'
          ? 'Your professional home for your craft.'
          : 'Let us know your role so we can personalize your experience.'
      }
      showImage={true}
    >
      {step === 'auth' ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OAuth Options */}
          <div className="grid grid-cols-2 gap-4">
            <OAuthButton provider="google" />
            <OAuthButton provider="apple" />
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="flex-shrink mx-4 text-caption font-caption text-outline">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">
              FULL NAME
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Amani Okafor"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="artist@circle.com"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-label-mono font-label-mono text-on-surface-variant mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full"
              required
            />
          </div>

          <div className="flex items-start gap-3 py-2">
            <input
              type="checkbox"
              id="terms"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              className="mt-1 rounded border-outline-variant text-primary"
            />
            <label htmlFor="terms" className="text-caption font-caption text-on-surface-variant">
              I agree to the{' '}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-primary text-white text-headline-md font-headline-md hover:opacity-90 transition-all shadow-lg shadow-primary/10"
          >
            Create Account
          </button>

          <div className="text-center text-body-md font-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              Log in
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('artist')}
            className="w-full p-6 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary transition-all text-left"
          >
            <h3 className="text-headline-md font-headline-md text-primary mb-2">I'm an Artist</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Get booked, get paid, and build your portfolio
            </p>
          </button>

          <button
            onClick={() => handleRoleSelect('organiser')}
            className="w-full p-6 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary transition-all text-left"
          >
            <h3 className="text-headline-md font-headline-md text-primary mb-2">I'm an Organizer</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              Find and book vetted talent for your events
            </p>
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
