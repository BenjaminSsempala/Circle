# Auth & Onboarding Flow - Frontend Only

This is a fully modular, frontend-only implementation of the auth and onboarding flows. It's designed to be easily integrated with APIs later.

## 📁 Folder Structure

```
app/
├── auth/
│   ├── signup/page.tsx       # Sign up with role selection (step 0)
│   └── login/page.tsx        # Login flow
├── onboarding/
│   ├── artist/page.tsx       # Step 1 of 4 - Claim your space
│   ├── package/page.tsx      # Step 2 of 4 - Create first package
│   ├── socials/page.tsx      # Step 3 of 4 - Connect platforms
│   └── success/page.tsx      # Step 4 of 4 - Profile is live!
├── dashboard/page.tsx        # Post-auth dashboard
├── components/
│   └── auth/
│       ├── AuthLayout.tsx    # Shared layout with image + form
│       └── AuthComponents.tsx# Reusable components (OAuthButton, etc)
├── context/
│   └── AuthContext.tsx       # Form state management (not used yet)
├── auth.css                  # Shared auth styling
└── layout.tsx                # Root layout with fonts
```

## 🔑 Key Features

### Frontend-Only Navigation
- All flows use **`if (true)`** flags to skip API calls
- Forms store data in `sessionStorage` instead of calling endpoints
- Easy to replace with real API calls later

### Modular Components
- `AuthLayout` - Reusable wrapper with optional sidebar image
- `OAuthButton` - OAuth provider buttons (Google, Apple)
- Platform cards in socials step are self-contained

### Form State Management
- Each page manages its own state with `useState`
- Optional `AuthContext` available for cross-step state (not currently used)
- Easy migration path to proper form libraries (React Hook Form, Zod, etc.)

### Styling System
- Custom CSS in `auth.css` with Tailwind-compatible class names
- Color variables matching Material Design 3 system
- Fully responsive (mobile-first)

## 🚀 Quick Start

1. **Signup Flow** → Navigate to `/auth/signup`
   - Fill form → Select role → Proceeds to onboarding

2. **Onboarding Flow** (4 steps):
   - `/onboarding/artist` - Profile info, tags, bio
   - `/onboarding/package` - First service package
   - `/onboarding/socials` - Connect social platforms (simulated)
   - `/onboarding/success` - Celebration screen with shareable link

3. **Login** → Navigate to `/auth/login`
   - Fill form → Redirects to `/dashboard`

## 🔌 Integration Points

### Ready for API Integration:

1. **Signup**
   ```typescript
   // Replace this:
   if (true) { setStep('role'); }
   
   // With API call:
   const response = await signupUser(formData);
   if (response.ok) { setStep('role'); }
   ```

2. **Onboarding Steps**
   ```typescript
   // Replace this:
   if (true) { router.push('/onboarding/package'); }
   
   // With API call:
   const response = await updateArtistProfile(formData);
   if (response.ok) { router.push('/onboarding/package'); }
   ```

3. **Social Connection**
   ```typescript
   // Simulate OAuth connection:
   const handleConnect = async (platform) => {
     // Call your OAuth endpoint
     const token = await getOAuthToken(platform);
     // Save to backend
     await savePlatformConnection(platform, token);
   };
   ```

## 📝 Adding Form Validation

Currently using basic HTML5 validation. For production:

```bash
npm install react-hook-form zod
```

Example upgrade path:
```typescript
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SignupForm = z.infer<typeof schema>;

export default function SignupPage() {
  const { register, handleSubmit } = useForm<SignupForm>();
  // ...
}
```

## 🎨 Theming

All colors defined in `:root` in `auth.css`:
- Primary: `#005440` (teal)
- Secondary: `#88520e` (amber)
- Tertiary: `#00543f` (green)

To customize, update the CSS variables or convert to Tailwind config.

## 🧪 Testing Flows

1. **Happy path**: Fill all forms correctly → Should progress smoothly
2. **Validation**: Leave fields empty → Should show alerts
3. **Social connection**: Click any platform → Should show connected state
4. **Skip options**: On socials page, "Skip" should still progress
5. **Session data**: Check browser DevTools → `sessionStorage` stores form data

## 🔐 Notes

- No actual authentication implemented (frontend only)
- Session storage cleared on logout
- Images are placeholder URLs (will need CDN URLs)
- Confetti animation on success page is canvas-based (lightweight)

## 📚 Next Steps

1. Add API endpoints
2. Replace `if (true)` blocks with real API calls
3. Add error handling
4. Implement form libraries (React Hook Form + Zod)
5. Add loading states
6. Connect to real auth provider (Firebase, Auth0, etc.)
7. Add email verification
8. Implement password reset flow
