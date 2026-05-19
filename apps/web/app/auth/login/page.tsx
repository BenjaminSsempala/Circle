'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OAuthButton } from '../../components/auth/AuthComponents';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert('Please fill all fields');
      return;
    }

    // Frontend-only flag - skip API wait
    if (true) {
      sessionStorage.setItem('userEmail', formData.email);
      // Redirect to dashboard
      router.push('/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to your Circle profile."
      showImage={true}
    >
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

        <div className="text-right">
          <Link href="#" className="text-primary text-body-md font-body-md hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-primary text-white text-headline-md font-headline-md hover:opacity-90 transition-all shadow-lg shadow-primary/10"
        >
          Log In
        </button>

        <div className="text-center text-body-md font-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
