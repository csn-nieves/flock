---
version: alpha
name: 'Flock'
description: 'A mobile-first run-club organizer with trail-aware clarity and a friendly group identity.'
colors:
  primary: '#369F60'
  primary-bright: '#42AD6C'
  primary-strong: '#246B41'
  on-primary: '#071E11'
  text: '#10243E'
  text-muted: '#536273'
  background: '#FFFFFF'
  surface-subtle: '#F3F7F4'
  border: '#D6E0D9'
  accent: '#D95F4C'
  focus: '#10243E'
  scrollbar-thumb: '#8BA897'
  scrollbar-track: '#EDF3EF'
typography:
  display:
    fontFamily: 'Avenir Next, Avenir, ui-rounded, system-ui, sans-serif'
  sans:
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
rounded:
  DEFAULT: '0.75rem'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  pill: '999px'
spacing:
  unit: '0.25rem'
  page-gutter: '1rem'
  page-max: '30rem'
  touch-target: '2.75rem'
components:
  application-shell:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
    width: '{spacing.page-max}'
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
    height: '{spacing.touch-target}'
  button-primary-hover:
    backgroundColor: '{colors.primary-bright}'
  button-primary-strong:
    backgroundColor: '{colors.primary-strong}'
    textColor: '{colors.background}'
  button-secondary:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    height: '{spacing.touch-target}'
  button-secondary-hover:
    backgroundColor: '{colors.surface-subtle}'
  text-field:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    height: '{spacing.touch-target}'
  text-field-error:
    textColor: '{colors.text}'
  supporting-surface:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.text-muted}'
  divider:
    backgroundColor: '{colors.border}'
  accent-marker:
    backgroundColor: '{colors.accent}'
  focus-ring:
    backgroundColor: '{colors.focus}'
  scrollbar-thumb:
    backgroundColor: '{colors.scrollbar-thumb}'
  scrollbar-track:
    backgroundColor: '{colors.scrollbar-track}'
  update-prompt:
    backgroundColor: '{colors.text}'
    textColor: '{colors.background}'
    rounded: '{rounded.lg}'
---

# Flock Design System

## Overview

### Creative North Star

Flock should feel like the moment a run club gathers at a familiar trailhead: energetic, coordinated, outdoors-oriented, and calm enough to use while standing on a sidewalk. The product is not a fitness-performance dashboard. It is a dependable place for people to find their group and get moving together.

### Product context and register

- **Audience and primary job:** Run-club organizers coordinate groups; runners join a flock and find the information needed to participate.
- **Target market and evidence:** English-language launch with no regional market assumptions beyond the product foundation.
- **Locale and language policy:** English initially. Interface copy uses direct, conversational sentence case.
- **Usage scene:** Phone-first, often outdoors and one-handed; desktop remains useful for organizers.
- **Register:** Product-first with restrained brand expression.
- **Memorable signature:** Distinct bird silhouettes form a forward-pointing flight formation, combining the ideas of flock and movement without becoming a bird mascot.
- **Restraint:** Navigation, forms, system feedback, and data must remain familiar and quiet.
- **Anti-references:** Avoid performance-heavy fitness dashboards, generic social-media bird marks, decorative gradients, and cream editorial styling.
- **Token ownership/runtime mapping:** This file records the approved durable system. `src/styles/tokens.css` is the canonical runtime mapping; Tailwind's theme aliases in `src/styles/global.css` expose those semantic values to components.

## Colors

Shamrock `#369F60` is the brand primary. Deep navy carries text and focus because it remains legible in daylight. Warm coral is a restrained accent for exceptional emphasis, not a competing primary. The application canvas is true white; pale green-gray is reserved for subtle supporting surfaces. Filled controls must use a foreground/background pairing that meets WCAG 2.2 AA rather than assuming white text works on shamrock.

## Typography

Display moments may use Avenir Next or the closest rounded system fallback. Product copy uses the system sans stack to avoid a blocking font download and preserve native legibility. Body text starts at 16px on phones. Sentence case is the default; uppercase is reserved for compact metadata only when letter spacing and readability are preserved.

## Layout

The application begins at a 360px viewport, fills the visual viewport with `dvh`/`svh` fallbacks, and respects every safe-area inset. The phone product surface is capped at 30rem on wider screens. A 4px base unit supports a practical 16px page gutter and 44px minimum touch targets. Document scrolling is the default until a feature has an explicit internal scroll owner.

## Elevation & Depth

Use borders and tonal surfaces before shadows. Floating system feedback may use one low, soft shadow so it remains distinguishable above content. Static sections and cards should not look detached from the page.

## Shapes

Corners are gently rounded rather than pill-heavy. Controls use 12px by default, compact elements use 8px, and only small status or identity marks use a full pill radius. Icons favor simple filled geometry or consistent round strokes.

## Components

### Foundational visual states

Every interactive control needs default, hover where available, focus-visible, pressed, disabled, and busy states. Focus uses a high-contrast navy ring with a white offset. Reduced-motion preferences remove non-essential transitions. Loading and feedback must not move surrounding controls.

### Buttons and actions

`src/primitives/Button.tsx` is the canonical button owner. Primary actions use the accessible shamrock system, with navy foreground on the exact brand color and white foreground on `primary-strong` while pressed. Secondary actions use a border and true-white surface, with `surface-subtle` on hover and press. Both variants preserve a 44px minimum target, visible focus, native disabled behavior, and stable labels. Labels name the actual outcome and remain stable while busy.

### Navigation and data display

Navigation will be introduced only when there are real destinations. Mobile controls must not depend on hover. Lists prioritize names and participation details over decorative metadata.

### Forms and overlays

`src/primitives/TextField.tsx` is the canonical owner for standard text-like inputs. It uses native input semantics, a visible label, a reserved description area, and linked hint or error text. Errors use explicit language and `aria-invalid`; coral reinforces the state but never carries it alone. Forms use app-owned validation and preserve useful native metadata such as input type, autocomplete, and input mode. Dialogs and feedback surfaces must respect safe areas and the virtual keyboard. Browser `alert`, `confirm`, and `prompt` are not product UI.

### Iconography

Use a single coherent round-stroke icon family when feature icons are introduced. The shamrock-and-soft-white app mark uses a small flight formation of bird silhouettes, not a single social-media bird. Icon-only actions require accessible names.

### Motion

Motion communicates state in roughly 160–220ms and must be interruptible. No ambient animation is planned. Under `prefers-reduced-motion`, transitions become effectively immediate.

### Content and data visualization

Copy is practical, brief, and written from the runner's point of view. The same action keeps the same name through trigger, progress, and result. Data visualization is deferred until the product has real route or participation data.

## Do's and Don'ts

- **Do:** Make the next useful action obvious at arm's length outdoors.
- **Do:** Derive all durable visual values from the documented semantic tokens and their Tailwind aliases.
- **Don't:** Turn Flock into a performance analytics dashboard.
- **Don't:** use cream backgrounds, ornamental gradients, or literal bird branding as default decoration.
