# Circle Web App - Documentation Index

> **Start here** if this is your first time with the Circle codebase.

## 🎯 Quick Navigation

### New to the Project?
1. Read: [`QUICKSTART.md`](QUICKSTART.md) (5 min)
2. Run: `npm run dev`
3. Test: Signup → Onboarding flows
4. Explore: File structure below

### Want to Integrate APIs?
1. Read: [`ONBOARDING_README.md`](ONBOARDING_README.md) - Architecture
2. Read: [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) - Code examples
3. Look for `if (true)` blocks → Replace with API calls

### Need to Debug?
1. Read: [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
2. Check: Browser DevTools → Session Storage
3. Check: Inline comments in source code

### Need Routes Reference?
- See: [`ROUTES.md`](ROUTES.md)

---

## 📁 File Structure

```
apps/web/
├── app/
│   ├── page.tsx                         ← Landing page
│   ├── layout.tsx                       ← Root layout (fonts, metadata)
│   ├── landing.css                      ← Landing page styles
│   ├── auth.css                         ← Auth/onboarding styles
│   ├── auth/
│   │   ├── login/page.tsx               ← Login screen
│   │   └── signup/page.tsx              ← Signup + role selection
│   ├── onboarding/
│   │   ├── artist/page.tsx              ← Step 1: Profile info
│   │   ├── package/page.tsx             ← Step 2: Create package
│   │   ├── socials/page.tsx             ← Step 3: Connect socials
│   │   └── success/page.tsx             ← Step 4: Success screen
│   ├── dashboard/page.tsx               ← Post-auth home
│   ├── components/
│   │   └── auth/
│   │       ├── AuthLayout.tsx           ← Reusable layout wrapper
│   │       └── AuthComponents.tsx       ← Shared UI components
│   ├── context/
│   │   └── AuthContext.tsx              ← State management (optional)
│   └── profile/                         ← [Future]
│
├── public/                              ← [For images, assets]
├── package.json
├── QUICKSTART.md                        ← Start here! ⭐
├── IMPLEMENTATION_SUMMARY.md            ← Full overview
├── ONBOARDING_README.md                 ← Architecture guide
├── TESTING_GUIDE.md                     ← How to test
└── ROUTES.md                            ← All routes mapped
```

---

## 🎓 Learning Path

### Path 1: Quick Test
```
1. Read QUICKSTART.md
2. npm run dev
3. Test signup/login flows
4. Done! ✓
```

### Path 2: Understand Architecture
```
1. Read IMPLEMENTATION_SUMMARY.md
2. Browse app/auth.css (styling system)
3. Read app/auth/signup/page.tsx (example page)
4. Check ONBOARDING_README.md (modular design)
```

### Path 3: Add APIs
```
1. Read ONBOARDING_README.md → Integration Points
2. Find if (true) blocks in code
3. Replace with fetch() calls
4. Add error handling
5. Test with real backend
```

### Path 4: Master All
```
1. QUICKSTART.md ← Getting started
2. IMPLEMENTATION_SUMMARY.md ← Architecture
3. app/auth.css ← Styling system
4. app/auth/signup/page.tsx ← Study one page
5. ONBOARDING_README.md ← Design philosophy
6. Explore all /onboarding/* pages
7. TESTING_GUIDE.md ← Test everything
8. ROUTES.md ← Route reference
```

---

## 💡 Key Concepts

### Frontend-Only (For Now)
- All data stored in `sessionStorage`
- No actual API calls
- `if (true)` flags allow instant progression
- Perfect for testing without backend

### Modular Architecture
- Each page is independent
- Reusable components extracted
- Easy to convert to component library later
- Clear separation of concerns

### Responsive Design
- Mobile-first approach
- Works: 375px → 1440px+
- Tailwind-style utility classes
- All pages tested on multiple sizes

### API-Ready
- Clear integration points documented
- Simple replacement patterns
- Form data already JSON
- Error handling structure ready

---

## 🔍 What Each Document Covers

| Document | Best For |
|----------|----------|
| **QUICKSTART.md** | Getting started in 5 minutes |
| **IMPLEMENTATION_SUMMARY.md** | Understanding full architecture |
| **ONBOARDING_README.md** | Learning modular design patterns |
| **TESTING_GUIDE.md** | Testing all flows manually |
| **ROUTES.md** | Quick route reference |

---

## 🚀 Before You Start

Make sure you have:
- ✅ Node.js 18+
- ✅ npm/pnpm
- ✅ Browser (Chrome/Firefox/Safari)
- ✅ Code editor (VS Code recommended)

```bash
# Check Node version
node --version

# Install dependencies
cd apps/web
npm install

# Start dev server
npm run dev

# Visit
open http://localhost:3000
```

---

## ❓ FAQ

**Q: Is this production-ready?**  
A: Frontend yes, backend no. Need to add API integration.

**Q: Can I use this as a template?**  
A: Yes! All code is modular and well-documented.

**Q: How do I add OAuth?**  
A: See ONBOARDING_README.md → "Add OAuth integration" example

**Q: Where do I store user data?**  
A: Currently `sessionStorage`. Need backend database for production.

**Q: Can I customize colors?**  
A: Yes! See auth.css `:root` variables or convert to Tailwind config.

---

## 🎯 Next Steps

1. **First time?** → Read `QUICKSTART.md` and run `npm run dev`
2. **Ready to code?** → Read `IMPLEMENTATION_SUMMARY.md`
3. **Need to debug?** → Check `TESTING_GUIDE.md`
4. **Building APIs?** → Check `ONBOARDING_README.md`

---

## 📞 Support

Each documentation file has examples and inline comments. Look for:
- 💡 Tips and tricks
- 📌 Important notes
- 🔗 Cross-references
- ✅ Checklists

Happy coding! 🚀
