---
name: Montasim Portfolio
description: Quiet neutral surfaces for readable professional evidence.
colors:
  background: "#f6f6f3"
  foreground: "#151614"
  card: "#ffffff"
  primary: "#151614"
  primary-foreground: "#f6f6f3"
  secondary: "#ecece7"
  secondary-foreground: "#20211f"
  muted: "#ecece7"
  muted-foreground: "#686a63"
  strong-foreground: "#41423e"
  emphasis-foreground: "#41423e"
  accent: "#ecece7"
  accent-foreground: "#20211f"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "#d8d8d0"
  input: "#d8d8d0"
  ring: "#c69043"
  dark-background: "#0d0f12"
  dark-foreground: "#c6cad1"
  dark-card: "#15181d"
  dark-primary: "#e7e9ed"
  dark-primary-foreground: "#111318"
  dark-secondary: "#1c2026"
  dark-secondary-foreground: "#d9dde3"
  dark-muted: "#1c2026"
  dark-muted-foreground: "#9299a3"
  dark-strong-foreground: "#d2d7df"
  dark-emphasis-foreground: "#e7e9ed"
  dark-accent: "#232933"
  dark-accent-foreground: "#edf0f4"
  dark-destructive: "oklch(0.704 0.191 22.216)"
  dark-border: "#2a3038"
  dark-input: "#39414c"
  dark-ring: "#78a8f8"
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.75rem"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
spacing:
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
  input:
    textColor: "{colors.strong-foreground}"
    rounded: "{rounded.lg}"
    height: "2.5rem"
    padding: "0.25rem 0.75rem"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
---

# Design System: Montasim Portfolio

## Overview

The inherited portfolio system is quiet and evidence-oriented: warm neutral light surfaces, cool dark surfaces, restrained borders, and Geist throughout. Content and typographic hierarchy carry the identity; compact controls support reading and navigation.

This document records the shared implementation sampled in `src/styles.css`, the page shell, site container, header, and UI primitives after the contact page shipped. The contact page's composition remains in its surface brief, not a global layout requirement. No new creative metaphor is introduced.

**Key Characteristics:**

- Neutral surfaces with distinct text emphasis levels.
- Compact rounded controls and bordered containers.
- Responsive shared page gutters and restrained motion.

## Colors

### Primary

The primary action uses foreground-like ink against a contrasting light label. In dark mode the pairing reverses. The ring color supplies amber focus in light mode and blue focus in dark mode; it is not a large decorative surface.

### Neutral

Background is the page canvas; card is the raised tonal surface. Muted supports helper text and secondary fills. Strong and emphasis foreground distinguish headings and actions from ordinary body text. Border and input provide separate semantic strokes, especially in dark mode. Destructive is reserved for error and destructive-action states.

**The Semantic Theme Rule.** Use the existing semantic CSS properties so each surface follows the light and dark mappings together. The `dark-` frontmatter entries document `.dark` overrides, not additional accents.

## Typography

Geist serves headings, body copy, and labels, with the source's sans-serif fallback stack. Bold, tightly tracked page headings anchor a hierarchy of semibold titles, regular prose, and compact medium-weight labels.

The recorded headline is the small-screen page heading; its common responsive step is (2.25rem) with (2.5rem) leading at the small breakpoint. Supporting copy commonly uses (0.875rem) with (1.5rem) leading; compact helper text uses (0.75rem) with (1.25rem) leading. These are observed roles rather than a new mathematical type scale.

## Layout

The shared container centers full-width content with a maximum width of (74rem), horizontal gutters of (1rem), and (1.5rem) gutters from the small breakpoint. Padded page shells use vertical space of (3rem), increasing to (4rem) at that breakpoint. Cards commonly use (1.25rem) insets, increasing to (1.5rem).

Layouts stack on narrow screens and add columns where their content warrants them. The contact page's supporting column is a local composition, not a universal template. The small, medium, and large breakpoints are the existing Tailwind defaults, recorded in the sidecar.

## Elevation & Depth

Borders and surface tones provide most separation. Cards have no default shadow. Inputs and textareas carry a small shadow; explicitly interactive surfaces add a diffuse hover shadow and a slight upward translation on fine pointers. The exact hover formula lives in the sidecar.

## Shapes

Controls use gently rounded corners; outline buttons, badges, and navigation use the smaller radius, standard buttons and fields the middle radius, and cards the larger radius. Thin strokes delineate inputs, cards, and structural dividers. Radius values derive from the existing base rather than an independent scale.

## Components

### Buttons

Compact, medium-weight actions support primary, outline, secondary, ghost, destructive, and link variants. Default controls are (2rem) high; large controls are (2.25rem). Outline actions use normal-weight subdued text and a card surface. Hover changes surface or emphasis; several filled variants lift by (1px), while pressing ordinary buttons shifts down by (1px). Disabled buttons reduce opacity and stop pointer interaction. The shared base suppresses the outline without defining a universal focus ring; this is not a rule for new controls to inherit.

### Inputs / Fields

Inputs and textareas share a stroked, softly rounded silhouette, muted placeholders, and strong text. Fields use (1rem) text, reducing to (0.875rem) at the medium breakpoint. Keyboard focus changes the border and adds a (2px) ring at twenty-percent opacity. Invalid states use destructive borders and rings; disabled states reduce opacity. Labels remain visible rather than relying on placeholders.

### Cards / Containers

Cards use the card surface and a thin semantic border. Header, content, and footer share responsive insets. Interactive elevation is opt-in, not intrinsic to every card.

### Chips

Badges are compact, normal-weight metadata with small corners. The default outline treatment uses subdued text and a transparent background; filled primary, muted secondary, and ghost variants exist.

### Navigation

A sticky bordered header contains compact text links. Hover and current location use the muted surface. Desktop links give way to a mobile sheet below the large breakpoint. Current-page semantics remain attached to the links.

## Do's and Don'ts

### Do:

- **Do** reuse semantic colors across both themes.
- **Do** reuse the shared container, field labels, and responsive insets.
- **Do** retain visible keyboard focus and reduced-motion behavior when extending controls.

### Don't:

- **Don't** turn the contact page's column arrangement into a global requirement.
- **Don't** substitute hard-coded light colors for theme-aware semantic properties.
- **Don't** make hover elevation the default state of every card.
