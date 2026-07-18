---
name: Enchanted Aisle
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#504444'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#827473'
  outline-variant: '#d4c2c2'
  surface-tint: '#7c5454'
  primary: '#7c5454'
  on-primary: '#ffffff'
  primary-container: '#d4a3a3'
  on-primary-container: '#5c3939'
  inverse-primary: '#edbaba'
  secondary: '#566252'
  on-secondary: '#ffffff'
  secondary-container: '#d4e1cd'
  on-secondary-container: '#586454'
  tertiary: '#675d4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#baad9c'
  on-tertiary-container: '#4a4133'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#edbaba'
  on-primary-fixed: '#2f1314'
  on-primary-fixed-variant: '#613d3d'
  secondary-fixed: '#d9e6d2'
  secondary-fixed-dim: '#bdcab7'
  on-secondary-fixed: '#141e12'
  on-secondary-fixed-variant: '#3e4a3b'
  tertiary-fixed: '#efe0cd'
  tertiary-fixed-dim: '#d2c4b2'
  on-tertiary-fixed: '#221a0f'
  on-tertiary-fixed-variant: '#4f4538'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.3'
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
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is centered on a romantic, whimsical narrative that celebrates the joy and magic of wedding planning. It moves away from cold, editorial minimalism toward an emotive, "storybook" aesthetic that feels both high-end and deeply personal.

The visual style is **Contemporary Romantic**, characterized by:
- **Whimsical Textures:** Soft, organic shapes and delicate floral accents that serve as functional anchors or decorative flourishes.
- **Airy Sophistication:** A heavy reliance on whitespace and a "light-drenched" atmosphere to evoke a sense of calm and clarity.
- **Invitational Tone:** Every interaction should feel like receiving a beautifully crafted wedding invitation—tactile, thoughtful, and warm.
- **Emotional Resonance:** Photography is treated with soft focus or warm filters, while UI elements use subtle gradients and blurs to maintain a dreamy quality.

## Colors

The palette is inspired by a botanical garden at dusk, featuring soft pastels and warm neutrals that provide a high-contrast but gentle reading experience.

- **Primary (Dusty Rose):** Used for primary actions, highlight states, and key emotive headings. It conveys warmth and romance.
- **Secondary (Sage Green):** A grounded, organic tone used for secondary actions, success states, and botanical accents.
- **Tertiary (Champagne):** A shimmering neutral used for container backgrounds, subtle borders, and soft highlights.
- **Neutral (Cream & White):** The foundation of the "bright and airy" look. Pure white (#FFFFFF) is reserved for the primary background, while #FAF9F6 (Alabaster) provides soft depth for layered cards.
- **Text:** To maintain the whimsical feel, avoid pure black. Use a deep, warm charcoal or a very dark version of the Sage Green for body copy to keep the contrast soft.

## Typography

This design system utilizes a high-contrast typographic pairing to balance tradition with modernity.

- **Headlines (Playfair Display):** Should be used with generous leading. For "Display" sizes, use italicized styles for specific words to emphasize the whimsical, hand-scripted feel of wedding stationery.
- **Body & Interface (Plus Jakarta Sans):** Chosen for its soft, rounded terminals that complement the whimsical brand style while ensuring maximum legibility for complex planning tasks.
- **Scalability:** Large displays should lean into the elegance of the serif, while mobile views shift toward tighter line heights to maintain a clean, organized appearance.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid with Generous Margins**. The objective is to prevent the UI from feeling "crowded," allowing each element to breathe—similar to a high-end editorial spread.

- **Desktop:** A 12-column grid with wide 40px margins and 24px gutters. Content should rarely span the full 12 columns to keep line lengths readable.
- **Mobile:** A 4-column grid with 16px margins. 
- **Rhythm:** Use an 8px base unit. Vertical rhythm is intentionally loose (stack-lg) between major sections to emphasize the "airy" quality, while internal card padding remains snug (stack-sm) for a tactile feel.
- **Asymmetry:** Occasionally break the grid with floating images or organic floral motifs to reinforce the whimsical theme.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering and Ambient Shadows**. We avoid harsh shadows in favor of a "lifted paper" effect.

- **Surface Tiers:** Backgrounds use pure white. Primary cards use a very subtle Champagne (#F5E6D3) or Cream tint to differentiate from the base layer.
- **Shadows:** Use extremely diffused, low-opacity shadows. The shadow color should not be grey; instead, use a tinted variant of the Primary or Secondary color (e.g., a dusty rose shadow with 5% opacity and 40px blur).
- **Glassmorphism:** Use subtle backdrop blurs (10px - 15px) for navigation bars and modal overlays to maintain the "light-drenched" atmosphere even when content is layered.

## Shapes

The shape language is soft and approachable. 

- **Corners:** Standard UI elements like buttons and cards use a 0.5rem (8px) radius. 
- **Large Containers:** Hero sections or large image cards should use `rounded-xl` (24px) to create a more "framed" and gentle look.
- **Organic Motifs:** Decorative elements (like photo frames) may use "squircle" shapes or slightly irregular organic paths to mimic natural forms like petals or leaves.

## Components

- **Buttons:** Primary buttons are "Pill-shaped" or highly rounded with a subtle Primary gradient. Use a hover state that slightly increases the shadow spread to feel "squishy" and responsive. Secondary buttons should use a fine 1px border in Dusty Rose.
- **Input Fields:** Use Alabaster (#FAF9F6) backgrounds with soft 8px corners. On focus, the border should transition to Sage Green with a very soft outer glow.
- **Chips & Tags:** Small, pill-shaped elements with light Sage or Rose backgrounds. Use them for wedding categories (e.g., "Floral," "Venue," "Photography").
- **Cards:** Cards should have no border, relying instead on the "lifted paper" ambient shadow and a slight tint of Champagne for depth. Images within cards should always have rounded corners.
- **Progress Indicators:** For the planning journey, use thin, delicate lines and circular nodes that resemble a string of pearls or a floral vine.
- **Lists:** Lists should be separated by very faint, high-transparency Champagne lines to maintain the airy aesthetic.