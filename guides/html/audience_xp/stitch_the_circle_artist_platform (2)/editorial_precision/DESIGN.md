---
name: Editorial Precision
colors:
  surface: '#fbf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#3f4944'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#6f7a74'
  outline-variant: '#bec9c3'
  surface-tint: '#086b53'
  primary: '#005440'
  on-primary: '#ffffff'
  primary-container: '#0f6e56'
  on-primary-container: '#9aedcf'
  inverse-primary: '#84d6b9'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
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
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#8af7cf'
  tertiary-fixed-dim: '#6edab4'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513d'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: DM Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

This design system is built upon the principles of high-end editorial design, blending the authoritative weight of traditional print with the fluid functionality of modern digital interfaces. The brand personality is sophisticated, curated, and intentional, targeting a professional audience that values clarity and aesthetic refinement.

The visual style is a hybrid of **Minimalism** and **Modern Editorial**. It prioritizes generous whitespace—referred to here as "breathing room"—to allow content to take center stage. High-contrast typography and a restrained color palette evoke the feeling of a premium physical publication. UI elements are secondary to the content, acting as subtle frames rather than distractions. The overall emotional response should be one of calm, confidence, and quiet luxury.

## Colors

The color strategy for the design system is rooted in an "Ink on Paper" philosophy. The palette uses a foundation of **Off-white** and **White** to create depth through subtle tonal shifts rather than shadows. 

**Ink** serves as the primary vehicle for information and structure, providing maximum legibility. **Teal** is used as the primary brand accent, reserved for meaningful actions and key highlights. **Teal Mid** and **Teal Light** provide functional variations for hover states, selections, and soft backgrounds. **Muted Grey** is used strictly for secondary metadata, ensuring the hierarchy remains undisputed. Borders are kept light and airy using the **Border** token to define containers without cluttering the composition.

## Typography

The typography in this design system is a study in contrast. **Playfair Display** provides an authoritative, editorial voice for headings and display moments. It should be used with tight leading to maintain a cohesive visual block.

**DM Sans** handles all functional UI and body copy. It is chosen for its modern, geometric clarity which balances the traditional nature of the serif display face. For technical data, export identifiers, or secondary labels, **DM Mono** provides a precise, rhythmic counterpoint. 

Always prioritize generous line-height for body text to ensure readability in long-form export formats. Large display sizes should utilize slight negative letter-spacing to mimic professional typesetting.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model inspired by classical book design. On desktop, content is housed within a 1200px max-width container using a 12-column grid. Gutters are fixed at 24px to maintain a rigid vertical rhythm.

Spacing follows an 8px base unit. To achieve the "Editorial" feel, use extreme values: very tight spacing (4px-8px) for related UI clusters, and very large spacing (80px+) to separate major content sections. This creates a "rhythm of pause" throughout the document.

**Breakpoints:**
- **Mobile (<768px):** 4-column grid, 16px side margins. Large headlines scale down to `headline-lg-mobile`.
- **Tablet (768px - 1024px):** 8-column grid, 32px side margins.
- **Desktop (>1024px):** 12-column grid, 64px side margins, centered container.

## Elevation & Depth

In keeping with the print-inspired aesthetic, this design system eschews heavy drop shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

Depth is communicated through the physical metaphor of stacked paper. The base "table" is **Off-white**, while the primary "page" is **White**. Elements that need to stand out from the page use a subtle 1px border in the **Border** color. 

When a heightened state is required (such as a dropdown or a modal), use a single, highly diffused "Ambient Shadow": `0 12px 32px rgba(26, 26, 26, 0.04)`. This shadow should feel like a soft glow rather than a dark silhouette, maintaining the lightness of the overall interface.

## Shapes

The shape language is disciplined and architectural. The default **Soft** (1) setting applies a 4px (0.25rem) radius to most UI components like buttons and input fields. This subtle rounding removes the harshness of digital "stiffness" while maintaining a precise, clean-cut look.

For larger containers like cards or featured sections, use `rounded-lg` (8px). Interactive elements that are purely functional, like tags or "chips," may occasionally use a pill-shape to distinguish them from structural elements, but this should be used sparingly to avoid making the design feel too "bubbly."

## Components

**Buttons**
Buttons are defined by strong typography. The primary button uses an **Ink** background with **White** text, 4px corners, and no shadow. Secondary buttons use a **Border** outline with **Ink** text. All buttons should have a minimum height of 44px to ensure touch-targets are accessible.

**Input Fields**
Inputs use a **White** background with a 1px **Border** stroke. Upon focus, the border transitions to **Teal** with no glow. Labels should always use the `label-bold` typographic style, positioned above the field.

**Chips & Tags**
Chips are rendered with **Teal Light** backgrounds and **Teal** text. They use the `mono-sm` font for a technical, "tagged" appearance.

**Cards**
Cards are defined by a **White** surface on an **Off-white** background. They should not use shadows; instead, use a 1px **Border** to define the perimeter. Internal padding should be generous (24px or 32px).

**Lists**
Lists utilize a horizontal rule (`1px solid #E4E4E0`) between items. The spacing between the rule and the text should be equal on top and bottom to maintain vertical balance.

**Checkboxes & Radios**
These are kept minimal. The active state uses the **Teal** primary color. The shape of the checkbox should remain slightly rounded (2px) to match the overall shape language.