---
name: ArtHearth Digital
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3f4944'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6f7a74'
  outline-variant: '#bec9c3'
  surface-tint: '#086b53'
  primary: '#005440'
  on-primary: '#ffffff'
  primary-container: '#0f6e56'
  on-primary-container: '#9aedcf'
  inverse-primary: '#84d6b9'
  secondary: '#88520e'
  on-secondary: '#ffffff'
  secondary-container: '#feb56b'
  on-secondary-container: '#774400'
  tertiary: '#00543f'
  on-tertiary: '#ffffff'
  tertiary-container: '#006f54'
  on-tertiary-container: '#85f1ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a0f3d4'
  primary-fixed-dim: '#84d6b9'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513e'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb870'
  on-secondary-fixed: '#2d1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#8af7cf'
  tertiary-fixed-dim: '#6edab4'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513d'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  base: 8px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
---

## Brand & Style
The brand identity centers on "Warm Modernism"—a blend of artisanal intimacy and professional clarity. It targets a sophisticated, culturally-aware audience that values authentic storytelling and craftsmanship.

The visual style is **Tactile Modern**, characterized by:
- **Atmospheric Depth:** Using deep teals and warm ambers to create a "gathered-around-a-fire" feeling.
- **High-End Artisanal:** Clean, unhurried layouts that prioritize high-quality media over dense information.
- **Professional Warmth:** Balancing the technical precision of monospaced fonts with the friendly, rounded curves of a contemporary sans-serif.

## Colors
The palette is rooted in an earthy, professional foundation. 

- **Primary:** A deep, forest teal (#0f6e56) used for core branding and navigation.
- **Secondary:** A warm, honey-gold (#854f0b) used for accents and drawing attention to specific cultural motifs.
- **Neutral:** A range of soft, off-white "clay" tones for surfaces, avoiding pure white to maintain a tactile, organic feel.
- **Feedback:** Success and progress states utilize a soft mint green derived from the tertiary palette, while errors use a muted, professional red.

## Typography
The system uses a dual-font approach to balance personality with utility:

- **Plus Jakarta Sans:** Chosen for its approachable but professional geometry. Used for all core interface text and expressive headlines.
- **JetBrains Mono:** Used sparingly for technical labels, hashtags, and metadata. This introduces a "curated" or "archival" feel to the content.
- **Hierarchy:** Strong contrast between bold, tight-tracking headlines and generous, airy body text ensures readability and an editorial pace.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model:
- **Max Width:** Content is capped at 1440px for desktop to prevent line-length issues and maintain composition.
- **Grid:** A 12-column grid system is used with 24px gutters.
- **Asymmetry:** Key sections (like the Hero) utilize a 2/3 and 1/3 split to create visual interest and dedicated space for sticky navigational tools.
- **Responsive Behavior:** 
  - **Desktop:** 64px side margins with multi-column bento grids.
  - **Mobile:** 16px side margins with single-column stacking and reduced headline scaling.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Shadows**:
- **Z-Index Strategy:** The Primary Navigation uses a `glassmorphism` effect (90% opacity blur) to remain present without obscuring the content.
- **Surface Tiers:** Backgrounds use `surface-container-low`, while active content cards use `surface-container-lowest` (pure white) to "lift" off the page.
- **Shadows:** Use extremely soft, tinted shadows (`rgba(15, 110, 86, 0.05)`) to evoke a sense of weight without the harshness of black-based shadows.
- **Interaction:** Hover states utilize a subtle `-4px` vertical translation to emphasize tactility.

## Shapes
The shape language is **Rounded and Friendly**:
- **Standard Radius:** 0.5rem (8px) for buttons and small components.
- **Large Radius:** 0.75rem (12px) to 1.5rem (24px) for cards and section containers, creating a soft, approachable frame for photography.
- **Full Radius:** Reserved for tags, chips, and profile avatars to provide maximum contrast against the structured grid.

## Components
### Buttons
- **Primary:** Filled with `primary-container`, using `on-primary-container` text. Subtle hover scale and color shifts.
- **Secondary:** Outlined with `primary-container`. High transparency hover states.
- **Special:** `secondary-container` (Gold) is used for high-conversion "Proposal" or "Premium" actions.

### Chips & Tags
- Pill-shaped with `surface-container` backgrounds and `primary` text. Uses `JetBrains Mono` for a "indexed" look.

### Cards
- Always use a 1px border (`outline-variant/20`) to define boundaries on light surfaces. 
- Portfolio cards utilize a bottom-up gradient overlay for legible typography over imagery.

### Input Fields
- Softly rounded (8px) with subtle background tints and 1px focus rings in the `primary` color.