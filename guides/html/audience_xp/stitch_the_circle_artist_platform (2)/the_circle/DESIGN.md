---
name: The Circle
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
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is built to evoke the "gathered-around-a-fire" energy—an intimate, professional, and credible space specifically for East African artists. It eschews the cold, sterile nature of traditional SaaS platforms in favor of a **warm modernism**. 

The style combines **Minimalism** with **Tactile** warmth. It prioritizes clarity and professional utility to ensure artists are taken seriously, while using a rich, organic color palette and soft geometry to maintain a sense of community and creative rhythm. The visual narrative is one of a "digital hearth," where high-end performance meets cultural heritage.

## Colors
The palette is rooted in a deep, authoritative **Deep Teal**, representing credibility and growth. This is balanced by **Accent Amber**, used sparingly to draw attention to interactive elements and status indicators, mimicking the glow of a fire.

- **Primary Stack:** The Deep Teal is the core of the brand. Use the Light and Mid variations for subtle layering, hover states, and soft containers.
- **Neutral Stack:** A true off-white background ensures the UI feels approachable rather than clinical. Dark Text (#1A1A1A) provides high legibility without the harshness of pure black.
- **Semantic Usage:** Use Amber for secondary calls to action or "moment of delight" highlights.

## Typography
The typography system uses **Plus Jakarta Sans** for its friendly yet professional geometric construction. It feels contemporary and carries an inherent "warmth" through its open counters and soft terminals. 

**JetBrains Mono** is introduced as a functional counterpoint. Use it exclusively for technical data points: pricing, timestamps, durations (for musicians/dancers), and status badges. This creates a clear visual distinction between "narrative/community" content and "logistical/professional" data. 
- Maintain a generous **1.6 line height** for body text to ensure a comfortable reading rhythm, essential for poetry and long-form artist bios.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a focus on generous whitespace to create the "intimate" feel. 

- **Desktop:** 12-column grid with 64px side margins. Large content blocks (like artist galleries) should use 24px gutters.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** Use an 8px base unit. Component internal padding should favor `md` (24px) for containers to avoid a cramped "tech" feel.
- **Content Density:** Keep information density medium-to-low. The UI should breathe, allowing the artist's work to be the focal point.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Ambient Shadows**. 

- **Level 0 (Background):** #FAFAFA.
- **Level 1 (Cards/Surfaces):** #FFFFFF with a very soft, diffused shadow (15% opacity Deep Teal or Neutral).
- **Level 2 (Modals/Popovers):** Higher elevation with a broader blur radius and a slight #0F6E56 tint in the shadow to maintain brand consistency.
- **Interactive States:** Use a slight "lift" (decrease shadow blur, increase Y-offset) on hover for cards to indicate playability and movement. Avoid harsh borders; use 1px strokes in Primary Light (#E1F5EE) for subtle containment.

## Shapes
The shape language is consistently rounded to reinforce the approachable and communal nature of the platform.

- **Primary Containers/Cards:** Use 12px (`rounded-lg`) for all main content containers.
- **Interactive Elements:** Buttons, input fields, and search bars use 8px (`rounded-md`).
- **Icons:** Use Lucide/Phosphor icons with a "Regular" stroke weight (2px) and slightly rounded joins.
- **Avoid:** Do not use 0px sharp corners or full pill-shaped buttons; the goal is a "tailored" look that feels custom and architectural.

## Components
- **Buttons:** 
  - *Primary:* Deep Teal background, white text, 8px radius. 
  - *Secondary:* Transparent background, Deep Teal border (1px), Deep Teal text.
  - *Tertiary:* Accent Amber background for high-priority calls like "Book Now."
- **Cards:** White background, 12px radius, soft ambient shadow. Use a 1px Primary Light (#E1F5EE) border for definition.
- **Input Fields:** 8px radius, off-white fill, 1px Primary Mid (#5DCAA5) border on focus.
- **Status Badges:** Use JetBrains Mono for the label. Backgrounds should be Primary Light (#E1F5EE) or Accent Amber Light (#FAEEDA) depending on the urgency.
- **Lists:** Use generous vertical padding (16px+) between list items to maintain the unhurried, professional rhythm.
- **Chips:** Small, 8px rounded elements for "Tags" (e.g., #Poetry, #TraditionalDance) using Deep Teal text on Primary Light backgrounds.