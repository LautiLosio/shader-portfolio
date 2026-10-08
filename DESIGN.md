---
name: Shader portfolio
description: Centered portfolio over the supplied interactive dot shader.
colors:
  background: "#000"
  foreground: "#f1f0ec"
  secondary: "#c5c3bf"
  muted: "#b0aea9"
  hover: "white"
  scrim-center: "#000d"
  scrim-mid: "#000c"
  scrim-edge: "#0008"
  motion-backing: "#0009"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(38px, 6vw, 76px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  name:
    fontFamily: "Manrope, sans-serif"
    fontWeight: 650
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(14px, 1.5vw, 16px)"
    lineHeight: 1.75
  navigation:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
  link:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
  footer:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
  display-short:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(28px, 7vh, 44px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  body-short:
    fontFamily: "Manrope, sans-serif"
    fontSize: "13px"
    lineHeight: 1.55
spacing:
  nav-gap: "12px"
  social-gap: "8px 24px"
  social-top: "32px"
  footer-gap: "16px"
components:
  navigation-button:
    textColor: "{colors.muted}"
    typography: "{typography.navigation}"
    padding: "12px 10px"
  navigation-active:
    textColor: "{colors.foreground}"
  external-link:
    textColor: "{colors.foreground}"
    typography: "{typography.link}"
    padding: "6px 2px"
  motion-toggle:
    backgroundColor: "{colors.motion-backing}"
    textColor: "{colors.muted}"
    typography: "{typography.footer}"
    padding: "12px"
---

# Design System: Shader portfolio

## Overview

The user's pinned composition governs this implementation: a black grayscale dot field, sparse centered Manrope text, and RGB separation through cursor movement or dragging. The supplied Android shader is the visual source. No alternate approved comp exists.

The introduction uses the user's preferred name, Lauti. The full identity remains Lautaro Losio. Public-facing biography uses evergreen role and technology descriptions without an employer mention. Public GitHub profile and README supply the email; the user supplied LinkedIn. Eight user-confirmed or public project links populate Projects: four live lauti.dev apps followed by four public repositories. The footer contains only the pause/resume control.

**Key Characteristics:**

- One viewport with short alternate content views.
- Grayscale at rest; color appears through shader interaction.
- Readable centered text with bounded contrast protection.
- No scrolling or text selection.

## Colors

The interface uses warm near-white text over black. The shader owns grayscale variation and interactive RGB; these are not interface accent tokens.

### Neutral

- Background is the black canvas and fallback when WebGL is unavailable.
- Foreground is headings, working links, active navigation, and keyboard focus.
- Secondary is descriptive copy.
- Muted is inactive navigation and motion controls.
- Hover is white for navigation and working links.
- Scrim colors create the static central radial gradient. Motion backing supports the pause control.

## Typography

Manrope is loaded through `next/font/google`, self-hosted by Next.js, with a sans-serif fallback. The introduction emphasizes the name by weight rather than color.

The frontmatter records desktop and portrait roles. Short viewports use a display size of `clamp(28px, 7vh, 44px)` and body text of `13px` with a `1.55` line height. Body copy has a maximum width of `43ch`, widened to `52ch` in short viewports. Headings balance lines; body text uses pretty wrapping.

## Layout

The page fills the dynamic viewport, with a small-viewport fallback. A grid centers a content column up to `610px` wide. Navigation wraps above the copy; social and project links wrap below it. Copy reserves `238px` of height, or `250px` on narrow screens, so short view changes retain the composition.

Stage padding accounts for safe-area insets with base top, side, and bottom values of `32px`, `24px`, and `76px`. Navigation bottom spacing is `clamp(24px, 6vh, 56px)`. The footer aligns the motion control to the right with safe-area offsets. At widths up to `480px`, navigation gaps shrink to `4px` and footer side offsets become `20px` and `12px`.

At heights up to `560px`, the stage uses `12px` top and `58px` bottom padding, navigation spacing contracts to `8px`, copy loses its reserved height, and social/email top margins become `8px`. This is the landscape-phone layout, not a second page.

## Elevation & Depth

There are no raised cards or panel shadows. Shader motion supplies depth. A static `radial-gradient(ellipse 65% 55% at 50% 48%, #000d 0%, #000c 45%, #0008 65%, transparent 100%)` keeps central text readable while preserving visible dots around it. The motion control has black translucent backing.

Text shadows reinforce contrast: headings use `0 2px 16px #000`; body copy uses `0 1px 8px #000, 0 2px 16px #000`; working links use `0 2px 8px #000`. These shadows do not replace the scrim.

## Shapes

The dot field supplies circular geometry. Controls are flat and borderless with no decorative containers. Keyboard focus has a `2px` foreground outline, a `5px` offset, and a `2px` radius. Interactive controls have a minimum height of `44px`; the motion toggle also has a minimum width of `44px`.

## Components

### Navigation

Four text buttons switch between Intro, About, Projects, and Contact in place. Active navigation uses foreground text and a single underline with a `7px` offset. Views announce changes through a polite, atomic live region.

### Links

External links include a small inline diagonal-arrow SVG, open in a new tab, and use `noopener noreferrer`. Hover adds an underline with a `5px` offset. LinkedIn, GitHub, eight project links, and a public email are populated from the confirmed profile. Contact uses a mailto link.

### Footer

The footer contains only a right-aligned motion button. It toggles pause/resume and exposes its state through `aria-pressed`. There are no draft notices, pending labels, or gesture instructions.

### Shader background

The native WebGL background preserves the supplied shader's brightness, radius, and softness: `DOT_COLOR vec3(0.35)`, `MAX_DOT_RADIUS 0.5`, and `DOT_SOFTNESS 0.1`. The user requested `THRESHOLD 0.1` and `THRESHOLD_SOFT 0.7`. Fine-pointer desktop uses `140` grid cells per shorter axis; other devices use `70`. Change density through grid size rather than shrinking or dimming dots.

Coordinates scale from the shorter viewport dimension, independent of backing resolution. Fine-pointer rendering caps DPR at `2` and pixels at `4,000,000`; other devices cap DPR at `1.5` and pixels at `1,600,000`. Native scale is the minimum of device DPR, the relevant cap, and the square-root pixel-budget scale. Effective scale is `max(min(1, nativeScale), nativeScale * quality)`. Adaptive quality can fall to `0.5` without rendering below one pixel per CSS pixel on ordinary viewports; oversized viewports still respect the pixel budget.

Desktop mouse movement requires no click. Frame-integrated cursor velocity feeds a linear impulse with gain `15`, bounded to length `1`, and exponential decay with a `0.18s` time constant. Desktop renders the impulse directly without an extra follower, so every stationary frame immediately decreases its strength. Touch and pen retain primary-pointer drag. Links, buttons, form controls, and elements marked `data-no-gesture` exclude gestures. Motion stops when paused, hidden, blurred, or under reduced-motion preference. Reduced motion draws a static frame and hides the motion button. Context loss hides the shader; restoration rebuilds it. WebGL failure leaves the black page readable.

## Do's and Don'ts

### Do:

- Do preserve the supplied shader's brightness, radius, softness, and RGB interaction.
- Do keep contrast protection static and bounded around text.
- Do preserve safe areas, compact landscape layout, visible focus, and pause behavior.
- Do use the confirmed public profile and repository destinations.

### Don't:

- Don't add scrolling or selectable text to this pinned composition.
- Don't replace the shader with a decorative approximation.
- Don't reintroduce draft notices or gesture hints.
- Don't reduce dot brightness, radius, or softness to simulate the denser desktop grid.
