## Brand & Style

The design system establishes an ultra-refined, high-velocity operational aesthetic tailored for autonomous AI command centers and enterprise orchestration platforms. It targets engineering leaders, systems architects, and intelligence analysts who demand absolute clarity under heavy cognitive load. 

The aesthetic is precision-driven minimalism: pristine porcelain planes, razor-thin structural perimeters, and deliberate electric accents. It rejects decorative noise in favor of functional radiance, evoking calm authority, institutional trust, and surgical computational efficiency inspired by modern craft standards.

## Layout & Spacing

The layout is governed by a fluid 12-column grid underpinned by a strict 4px base increment.

- **Grid Dynamics**: Desktop operations run on a full-width adaptive canvas with a fixed 280px agent tree navigation rail, 1.5rem column gutters, and 2rem outer viewport margins.
- **Breakpoints**:
  - `Desktop (> 1280px)`: 12 columns, full multi-pane orchestration, side-by-side terminal inspection.
  - `Tablet (768px - 1279px)`: 8 columns, collapsible sub-inspector drawer, stacked log telemetry.
  - `Mobile (< 767px)`: 4 columns, single-stream operational feed, sticky bottom command dock.
- **Information Density**: Component interiors employ `density-compact` (6px) vertical pads for tables and log clusters, scaling up to `density-spacious` (20px) for high-level model overview cards.

## Elevation & Depth

Elevation rejects heavy drop shadows, relying on layered luminosity, tonal surface shifts, and whisper-thin outlines.

- **Surface Tiers**:
  - **Ground Floor (`#FAFAFA`)**: Main application background.
  - **Card/Container (`#FFFFFF`)**: Foreground workspace layers bordered by `1px solid rgba(9, 9, 11, 0.06)`.
  - **Elevated Hover (`#FFFFFF`)**: Active interactive modules shift up with an ambient diffusion: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 16px 0 rgba(0, 0, 0, 0.03)`.
  - **Overlay/Modal (`#FFFFFF`)**: Command palettes and floating inspector sheets use `0 12px 32px -4px rgba(0, 0, 0, 0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.03)`, framed by a crisp `#E4E4E7` border.
- **Backdrop Blur**: Floating glass control strips apply `backdrop-filter: blur(12px)` over a `rgba(255, 255, 255, 0.85)` fill.

## Components

### Buttons
- **Primary**: Solid `#09090B` background with `#FFFFFF` text and a fine internal inset highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.16)`). On hover, subtle transition to `#27272A`. Focused with a 2px offset ring in `#2563EB`.
- **Secondary / Kinetic**: Pure `#FFFFFF` fill, bordered by `1px solid #E4E4E7`, `#09090B` text. On hover, background shifts to `#F4F4F6` with an airy elevation shadow.
- **Ghost**: Transparent fill, `#71717A` text, changing to `#09090B` text with a `#F4F4F6` wash on hover.

### Chips & Badges
- **Autonomous Status Pill**: Translucent background (`rgba(5, 150, 105, 0.08)`), text in `#059669`, containing a pulsing 6px circular emerald beacon (`#059669`) with an ambient outer glow.
- **Execution Metric Badge**: Grounded `#F4F4F6` background, `#52525B` text, Geist font, border `1px solid rgba(0, 0, 0, 0.04)`.

### Lists & Data Streams
- Compact grid rows alternating between `#FFFFFF` and `#FAFAFA` on hover.
- Separators use hairline rules (`rgba(0, 0, 0, 0.05)`).
- Critical columns feature monospace alignment with fixed tabular digits (`font-variant-numeric: tabular-nums`).

### Checkboxes & Radio Buttons
- 16x16px boxes with a 4px corner radius.
- Unchecked: `1px solid #D4D4D8` on pure `#FFFFFF`.
- Checked: `#2563EB` fill displaying a sharp `#FFFFFF` check icon, accompanied by a subtle outer bloom.

### Input Fields & Command Prompts
- Background `#FFFFFF`, 1px solid `#E4E4E7`, with an inset shadow `inset 0 1px 2px rgba(0, 0, 0, 0.02)`.
- Active focus smoothly expands into `border-color: #2563EB` paired with an electric diffusion `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`.
- Integrated terminal shortcut hints (`⌘K`, `↵`) rendered in `#71717A` with a `#F4F4F6` key cap surface.

### Cards & Module Frames
- Pure white surfaces with `1px solid rgba(9, 9, 11, 0.06)`.
- Segmented header bars featuring small uppercase section titles (`label-caps`) alongside live agent node counters.
- Subdued light-gradient divider lines separating metric summaries from action zones.

### Terminal & Agent Stream Console
- Background `#F8FAFC`, hairline `#E2E8F0` border, with strict mono font styling.
- Live autonomous runs highlight current instruction execution with a subtle blue left border strip (`#2563EB`, 2px width) and an ambient cyan fading background highlight.