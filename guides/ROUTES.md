// Next.js App Router - Route Map for Circle

// Landing & Public Routes
GET  /                          → Landing page with hero & CTAs
GET  /#how                      → Scroll to "How it works" section
GET  /#organiser                → Scroll to org section

// Auth Routes
GET  /auth/login                → Login page (email/OAuth)
POST /auth/login                → Submit login (frontend only)
GET  /auth/signup               → Signup page (email/OAuth)
POST /auth/signup               → Submit signup (frontend only)

// Onboarding Flow (Artist)
GET  /onboarding/artist         → Step 1 of 4 - Profile info
POST /onboarding/artist         → Save profile, move to step 2
GET  /onboarding/package        → Step 2 of 4 - Create package
POST /onboarding/package        → Save package, move to step 3
GET  /onboarding/socials        → Step 3 of 4 - Connect platforms
POST /onboarding/socials        → Save platforms, move to step 4
GET  /onboarding/success        → Step 4 of 4 - Success page

// Post-Auth Routes
GET  /dashboard                 → User dashboard/home

// Future Routes (Not Yet Implemented)
GET  /profile/:username         → Public artist profile
GET  /profile/:username/edit    → Edit your profile
GET  /packages                  → Manage packages
GET  /packages/:id/edit         → Edit package
GET  /bookings                  → View bookings
GET  /bookings/:id              → Booking details
GET  /settings                  → Account settings
GET  /help                      → Help/FAQ
GET  /about                     → About page

/**
 * TESTING FLOWS
 * 
 * Default Happy Path:
 * 1. Start: /
 * 2. Click "Join free": → /auth/signup
 * 3. Fill signup form → Select role → Step 1
 * 4. Fill profile info → /onboarding/artist → Step 2
 * 5. Fill package info → /onboarding/package → Step 3
 * 6. Connect platforms → /onboarding/socials → Step 4
 * 7. View success → /onboarding/success
 * 8. Go to dashboard → /dashboard
 * 
 * Login Path:
 * 1. Start: / → Click "Log in" → /auth/login
 * 2. Fill login → /dashboard
 * 
 * Skip Platforms:
 * 1. On /onboarding/socials → Click "Skip For Now"
 * 2. Goes directly to /onboarding/success
 */
