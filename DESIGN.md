---
version: alpha
name: Atlas: Spatial Timeline
description: >
  A local-first macOS photo-location timeline. The visual identity is quiet,
  dark, spatial, and chronological: black ground, charcoal panels, soft gray
  type, thin route lines, small location dots, horizontal time on desktop, and
  compact stacked time on mobile.

colors:
  primary: "#E8E8E8"
  secondary: "#888888"
  tertiary: "#FFFFFF"
  neutral: "#0A0A0A"
  surface: "#141414"
  surface-raised: "#181818"
  surface-hover: "#222222"
  border: "#222222"
  border-strong: "#333333"
  muted: "#555555"
  scrim: "rgba(0, 0, 0, 0.5)"
  danger: "#EE5555"
  success: "#55EE55"

typography:
  family:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
  year:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 32px
    fontWeight: 200
    lineHeight: 1
    letterSpacing: 4px
  year-mobile:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 18px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: 1px
  place-title:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0em
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
  body-strong:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  metadata:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0em
  label-caps:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 1.5px
    textTransform: uppercase
  stat:
    fontFamily: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, sans-serif
    fontSize: 28px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: 0em

rounded:
  none: 0px
  xs: 3px
  sm: 4px
  md: 6px
  lg: 8px
  sheet: 16px
  full: 999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  section: 24px
  panel: 32px
  page: 40px

motion:
  fast: 150ms
  base: 200ms
  panel: 250ms
  easing: ease

components:
  app-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  nav-bar:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    height: 44px
    padding: 0 16px
  nav-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 6px 14px
  nav-tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  timeline-line:
    backgroundColor: "{colors.border-strong}"
    height: 1px
  timeline-dot:
    backgroundColor: "{colors.primary}"
    size: 6px
    rounded: "{rounded.full}"
  timeline-city:
    textColor: "{colors.primary}"
    typography: "{typography.body-strong}"
  timeline-region:
    textColor: "{colors.secondary}"
    typography: "{typography.metadata}"
  timeline-date:
    textColor: "{colors.muted}"
    typography: "{typography.metadata}"
  time-header:
    textColor: "{colors.muted}"
    typography: "{typography.year}"
  month-header:
    textColor: "{colors.secondary}"
    typography: "{typography.label-caps}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    width: 340px
  panel-wide:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    width: 400px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 10px 20px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 10px 20px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    height: 42px
  context-menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 4px
---

# Atlas: Spatial Timeline

## Overview

Atlas is a local photo-location timeline rendered as a quiet spatial record. It
should feel like a native macOS utility for inspecting personal movement over
time: calm, precise, private, and fast.

The interface has two recurring modes:

- **Timeline:** a chronological route surface with small dots, thin lines, date markers, and compact place labels.
- **Inspector:** slide-over panels and index lists for places, settings, sync status, and visit history.

## Colors

The palette is black, charcoal, soft white, and muted gray.

- **Neutral (#0A0A0A):** page background and empty space.
- **Surface (#141414):** active tabs, side sheets, menus, and raised controls.
- **Primary (#E8E8E8):** city names, active navigation, primary button fills, and timeline dots.
- **Secondary (#888888):** regions, labels, inactive-but-readable metadata.
- **Muted (#555555):** dates, inactive icons, counts, and low-priority status values.
- **Border (#222222):** panel dividers, input outlines, settings rows, and menu frames.
- **Border Strong (#333333):** the main timeline rule.

Pure white is reserved for hover emphasis only. Do not introduce saturated brand
colors unless they indicate destructive or success states.

## Typography

Use the macOS system sans stack everywhere. Atlas should feel native rather than
editorial.

Place names use 14-18px medium weight. Metadata uses 11-13px regular weight.
Year markers are intentionally thin and oversized on desktop so they sit behind
the timeline as temporal landmarks.

Use tabular numbers for counts, sync stats, dates, and duration values. Uppercase
tracked text is allowed for month labels and state headings only.

## Layout

The desktop timeline is horizontal. It sits near the vertical center of the
window, with entries extending along a single 1px line. Scrolling vertically over
the page should move the timeline horizontally.

The mobile timeline is vertical. Time headers sit to the left of the line, and
place entries sit to the right. Preserve readability from 375px wide.

Use fixed slide-over panels for secondary tasks. On desktop, panels enter from
the right. On mobile, panels enter from the bottom with a rounded top sheet.

Avoid dashboards, marketing hero sections, floating cards, or ornamental maps.
Atlas is an inspection tool, not a landing page.

## Elevation & Depth

Depth is mostly flat. Use surface contrast, dividers, and motion instead of
decorative lighting.

Allowed depth treatments:

- 1px borders for panels, rows, inputs, and menus.
- A black scrim behind modal panels.
- A small context-menu shadow when needed for separation.

Avoid gradients, glassmorphism, glow, blur, large drop shadows, and textured
backgrounds.

## Shapes

The timeline, rows, panels, and list structures are square by default.

Use radius only where it improves native control affordance:

- 4-8px for buttons, inputs, tabs, and context menu items.
- Full radius for circular icon buttons, toggles, and timeline dots.
- 16px top radius for mobile bottom sheets only.

Do not use rounded cards as the main organizing device.

## Components

`NavBar` is minimal: two tabs on the left and settings on the right. It should
not compete with the timeline.

`TimelineEntry` is the core unit: dot, city, region, and date range. Labels must
stay compact and non-wrapping on desktop.

`TimeHeader` marks year and month changes. Years are large, thin, muted, and
spaced. Month labels are small, uppercase, and tracked.

`PlacesIndex` is a centered, narrow text index grouped by country and state. It
should feel like a list of known places, not a card grid.

`DetailPanel` summarizes one place with visit count, total days, and a simple
date list. The Google Maps link is secondary and should never dominate the
panel.

`SettingsPanel` is utilitarian. Controls should be clear, compact, and stacked
with simple dividers. Sync stats are rows, not cards.

`ContextMenu` is the only floating menu. It may use a subtle shadow because it
appears above dense text.

## Motion

Motion should be short and functional.

- Color and background hover transitions: 150-200ms.
- Panel enter and exit: 250ms.
- Spinner rotation: linear 800ms.

Do not animate the timeline itself except through direct scrolling. Do not add
springy, bouncy, or decorative transitions.

## Responsive Behavior

Desktop starts with a horizontal timeline and right-side panels.

At mobile widths:

- Navigation height reduces from 44px to 40px.
- Timeline changes from horizontal to vertical.
- Timeline entries increase slightly in text size for tap readability.
- Detail and settings panels become bottom sheets.
- Places index keeps a single-column reading flow with tighter side padding.

Any new view must work at 375px width without horizontal page overflow.

## Do's and Don'ts

- **Do** keep the app dark, quiet, local, and inspection-oriented.
- **Do** use the existing neutral text ramp before adding new colors.
- **Do** preserve the timeline as the dominant visual object.
- **Do** make panels feel native, compact, and task-focused.
- **Don't** add gradients, glows, decorative illustrations, or marketing copy.
- **Don't** introduce another font family.
- **Don't** turn place lists or settings into card dashboards.
- **Don't** use saturated color except for destructive or success feedback.
