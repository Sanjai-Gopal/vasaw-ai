---
name: Obsidian Nexus
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1f1f24'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343439'
  on-surface: '#e3e2e8'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#f5fff3'
  on-secondary: '#003919'
  secondary-container: '#34ff8d'
  on-secondary-container: '#007239'
  tertiary: '#faf3ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#7213ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#60ff99'
  secondary-fixed-dim: '#00e479'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005228'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#121317'
  on-background: '#e3e2e8'
  surface-variant: '#343439'
typography:
  headline-xl:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The design system embodies a high-performance "Command Center" aesthetic, tailored for expert users managing complex AI agent fleets. The visual narrative is built on **Dark Glassmorphism**—a sophisticated interplay of deep obsidian surfaces, ultra-refined translucent layers, and high-energy accents.

The personality is authoritative yet innovative, utilizing high-tech telemetry and micro-glows to indicate system vitality and real-time processing. This system prioritizes a sense of "digital depth," where the UI feels like a physical glass instrument panel floating in a void of secure, high-performance computing.

## Colors
The palette is anchored in **Obsidian (#0B0C10)** and **Charcoal (#121317)** to provide a canvas for vibrant neon accents. 

- **Primary Cyan (#00F0FF):** Reserved for active agent states, primary actions, and critical data focus.
- **Neon Emerald (#00FF88):** Used for "Success" states, system health, and finalized AI outputs.
- **Electric Violet (#7000FF):** A tertiary accent used for "Processing" states or high-intelligence AI reasoning paths.
- **Glass Overlays:** Surfaces utilize a 40-60% opacity version of the neutral palette with a `blur(20px)` backdrop filter to create the glass effect.

## Typography
The typography strategy creates a contrast between "Human Narrative" and "System Data." 

- **Syne** is used for impactful headings, its unconventional forms reflecting the cutting-edge nature of AI.
- **Inter** provides maximum legibility for core UI controls, descriptions, and user inputs.
- **JetBrains Mono** is utilized for all "Telemetry" data, logs, and system statuses, reinforcing the technical precision of the command center. Use `label-caps` for small, non-interactive identifiers and technical headers.

## Layout & Spacing
The design system employs a **Fluid-Fixed Hybrid Grid**. The sidebar and utility panels are fixed-width to maintain consistent telemetry readouts, while the central command stage is fluid.

- **Rhythm:** An 8px base grid governs most layout decisions, but a 4px micro-grid is used for dense data components.
- **Density:** High density. Elements are packed efficiently to maximize information throughput, separated by thin glass dividers rather than wide gaps.
- **Mobile:** On mobile devices, side panels collapse into a bottom-drawer "Console" and margins shrink to 16px.

## Elevation & Depth
Depth is not communicated through shadows, but through **Luminance and Refraction**.

- **Z-Axis Layers:** Base layer is solid #0B0C10. Tier 1 surfaces are 60% opaque #121317 with a 1px #FFFFFF10 (hairline) border. Tier 2 (modals/popovers) uses 80% opacity and a subtle primary-tinted glow (10px blur, 5% opacity).
- **Hairline Borders:** Use a 1px solid border on all glass containers. For active elements, this border should transition to the Primary Cyan color with a subtle outer glow.
- **Backdrop Blur:** A standard 20px blur is applied to all glass surfaces to ensure text legibility over moving or complex background telemetry.

## Shapes
The shape language is "Precision-Softened." We avoid aggressive rounding to maintain a professional, architectural feel.

- **Base Radius:** 4px (Soft) for most UI elements like buttons, inputs, and small containers.
- **Large Containers:** Use 8px (rounded-lg) for main dash cards.
- **Telemetry Indicators:** Use 0px (sharp) for data bars and progress indicators to emphasize technical accuracy.

## Components
- **Primary Buttons:** High-contrast Cyan fill with black text. On hover, add a 15px Cyan outer glow. Use `label-caps` typography.
- **Glass Cards:** 1px white-translucent border, 20px blur. No drop shadow; depth is achieved via the backdrop filter.
- **Input Fields:** Dark background (#0B0C10), 1px border. On focus, the border glows Primary Cyan and the label shifts to the data-mono style.
- **Telemetry Chips:** Small, rectangular tags with #00FF88 (Emerald) text and a 10% opacity Emerald background.
- **Status Lights:** Small 6px circles. Use "Pulse" animations (0.5s duration) for active AI processing states.
- **System Logs:** Monospaced (JetBrains Mono) text blocks with alternating line backgrounds (5% white opacity) for readability.