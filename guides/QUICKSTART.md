# 🚀 Quick Start - Circle Web App

## 5-Minute Setup

```bash
cd apps/web
npm install
npm run dev
```

Open: **http://localhost:3000**

## Test Right Now

### 1. **Try Landing Page**
- Click **"Join free"** → Goes to signup
- Click **"Log in"** → Goes to login

### 2. **Try Signup Flow**
- Path: `/auth/signup`
- Fill in: Name, Email, Password
- Accept terms checkbox
- Click "Create Account"
- **Choose Role** (Artist/Organizer)
- Gets sent to `/onboarding/artist`

### 3. **Try Onboarding (4 Steps)**
- **Step 1** (Artist): Fill profile info, click "Continue"
- **Step 2** (Package): Create a service package, click "Continue"
- **Step 3** (Socials): Click any platform to "connect", click "Continue"
- **Step 4** (Success): Copy your shareable link, click dashboard

### 4. **Try Login**
- Path: `/auth/login`
- Any email/password works (frontend only)
- Gets sent to `/dashboard`

## 📁 Key Files to Know

| File | What It Does |
|------|-------------|
| `app/page.tsx` | Landing page |
| `app/auth/signup/page.tsx` | Signup form |
| `app/auth/login/page.tsx` | Login form |
| `app/onboarding/artist/page.tsx` | Onboarding Step 1 |
| `app/onboarding/package/page.tsx` | Onboarding Step 2 |
| `app/onboarding/socials/page.tsx` | Onboarding Step 3 |
| `app/onboarding/success/page.tsx` | Onboarding Step 4 |
| `app/auth.css` | All auth styling |

## ⚙️ What's Included

✅ **Landing Page** - Full hero, features, CTAs  
✅ **Auth Screens** - Login, Signup with OAuth buttons  
✅ **4-Step Onboarding** - Profile → Package → Socials → Success  
✅ **Responsive Design** - Mobile, tablet, desktop  
✅ **Dashboard** - Post-auth home  
✅ **Form Validation** - Basic HTML5 validation  
✅ **Session Storage** - Temporary data persistence  

## ❌ NOT Included (Frontend Only)

❌ No backend API calls  
❌ No real authentication  
❌ No database  
❌ No OAuth provider integration  
❌ No email verification  

**All ready to add!** See `ONBOARDING_README.md` for integration guide.

## 🎨 Design Colors

- **Primary** (Action buttons): `#005440` (Teal)
- **Secondary** (Accents): `#88520e` (Amber)
- **Background**: `#fcf9f8` (Off-white)

## 📱 Responsive Tested

- Mobile: 375px+ ✓
- Tablet: 768px+ ✓
- Desktop: 1024px+ ✓

## 🔍 Debug Tips

**Check saved data:**
1. Open DevTools → Application
2. Go to Session Storage
3. See: `userEmail`, `onboarding_artist`, etc.

**Test validation:**
1. Go to any form
2. Leave field empty
3. Click submit
4. Should show alert

**Test navigation:**
1. Click back button on onboarding
2. Should go to previous step
3. Data persists in SessionStorage

## 📚 More Info

- Full details: `IMPLEMENTATION_SUMMARY.md`
- Testing guide: `TESTING_GUIDE.md`
- Route map: `ROUTES.md`
- Onboarding docs: `ONBOARDING_README.md`

## 🎯 Next Steps (When Ready for APIs)

1. Add `/api/auth/signup` endpoint
2. Add `/api/auth/login` endpoint
3. Replace `if (true)` with real API calls
4. Add error handling
5. Connect to OAuth providers

See `ONBOARDING_README.md` → Integration Points section.

---

**Ready?** Run `npm run dev` and start testing! 🎉
