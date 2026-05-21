# Circle App - Navigation Guide

## 🏠 Main Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and CTAs |
| `/auth/login` | Login with email/OAuth |
| `/auth/signup` | Signup with email/OAuth + role selection |
| `/dashboard` | Post-auth dashboard |

## 🚀 Onboarding Flow

Follow the 4-step artist onboarding:

1. **Step 1** → `/onboarding/artist` 
   - Fill: Full name, tags, art form, city, bio
   - Next: Package creation

2. **Step 2** → `/onboarding/package`
   - Fill: Package name, price, currency, duration, description
   - Next: Social connection

3. **Step 3** → `/onboarding/socials`
   - Click: Connect any platform (YouTube, Spotify, TikTok, Instagram, SoundCloud)
   - Next: Success page

4. **Step 4** → `/onboarding/success`
   - See: Shareable profile link
   - Copy link or view profile
   - Action: Go to dashboard

## 💡 Testing Flows

### Happy Path (No Validation Errors)
```
/ → Join → Signup → Artist Role → Onboarding (Step 1-4) → Success → Dashboard
```

### Login Path
```
/ → Log In → Login → Dashboard
```

### Skip Socials
```
On Step 3 (Socials) → Click "Skip For Now" → Success page
```

### Connect Platforms
```
On Step 3 (Socials) → Click any platform icon → Shows "Connected" ✓
```

## 🔍 SessionStorage Data

Open DevTools → Application → Session Storage

You'll see:
- `userEmail` - Email from signup/login
- `userRole` - "artist" or "organiser"
- `onboarding_artist` - Step 1 data (JSON)
- `onboarding_package` - Step 2 data (JSON)
- `onboarding_socials` - Step 3 data (JSON)

## ⚙️ Frontend Flags

Every step uses `if (true)` to skip API calls:

```typescript
// Instead of waiting for API:
if (true) {
  router.push('/next-page');
}
```

To add real API calls, replace with:
```typescript
const response = await apiCall(formData);
if (response.ok) {
  router.push('/next-page');
}
```

## 🎨 Styling

- Base stylesheet: `app/auth.css`
- Landing CSS: `app/landing.css`
- Fonts: Plus Jakarta Sans, JetBrains Mono, DM Sans, Playfair Display

## 📱 Responsive Breakpoints

- Mobile: Default
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)

## 🚨 Known Limitations (Frontend-Only)

- ❌ No actual authentication
- ❌ OAuth buttons don't redirect to providers
- ❌ Social platform connections are simulated
- ❌ No email verification
- ❌ No backend persistence

These are all ready for API integration!

## ✅ Ready to Test

1. Run dev server: `npm run dev`
2. Visit: `http://localhost:3000`
3. Click "Join free" or "Log in"
4. Fill forms and progress through flows
5. Check SessionStorage for data
