
# How to Prompt an LLM to Write a Website Design Spec

A design spec written by an LLM is only as good as the brief you give it. The more context and constraints you supply upfront, the more actionable and opinionated the output will be.

-----

## The Core Prompt Structure

Use this skeleton and fill in the bracketed sections:

```
You are a senior UX/product designer. Write a detailed design specification for a website with the following context:

**Project:** [Name and one-sentence description]
**Audience:** [Who uses it, their goals, their technical level]
**Core use cases:** [2–4 primary things users come to do]
**Tone / aesthetic direction:** [e.g. "brutally minimal", "warm and editorial", "high-tech dashboard"]
**Technical constraints:** [Stack, framework, browser support, performance targets]
**Deliverable format:** [See below]

The spec should include: information architecture, page inventory, layout structure, component library, typography system, color system, motion principles, responsive behaviour, and accessibility requirements.
```

-----

## What to Ask For (Sections to Request)

Tell the LLM exactly which sections you want. Pick from this list:

### 1. Project Overview

- Purpose, goals, success metrics
- Target users and key jobs-to-be-done

### 2. Information Architecture

- Sitemap / page inventory
- Navigation model (top nav, sidebar, breadcrumbs)
- Content hierarchy per page type

### 3. Layout System

- Grid definition (columns, gutters, margins)
- Breakpoints and responsive rules
- Page templates (homepage, interior, landing, etc.)

### 4. Component Library

- List every reusable component (buttons, cards, modals, forms, tables…)
- For each: states (default, hover, active, disabled, error), variants, anatomy

### 5. Typography System

- Typeface choices with rationale
- Type scale (sizes, weights, line-heights)
- Usage rules per context (heading, body, caption, code)

### 6. Color System

- Brand palette with hex/HSL values
- Semantic tokens (primary, secondary, surface, border, error, success…)
- Dark mode considerations if applicable

### 7. Spacing & Motion Principles

- Base unit and spacing scale
- Easing curves and duration values
- Animation rules (what gets animated, what doesn’t)

### 8. Accessibility Requirements

- WCAG level target (AA or AAA)
- Focus management rules
- Minimum contrast ratios, touch target sizes

### 9. Handoff Notes

- Figma/token naming conventions
- Engineering notes per component
- Open questions / decisions deferred

-----

## Sharpening the Output: Key Modifiers

Add these phrases to get better results:

|Goal                              |Add to your prompt                                                                          |
|----------------------------------|--------------------------------------------------------------------------------------------|
|More opinionated aesthetic choices|`"Make bold, specific design decisions. Do not hedge. Pick one direction and commit to it."`|
|Avoid generic output              |`"Avoid clichés: no purple gradients, no Inter/Roboto, no cookie-cutter layouts."`          |
|Structured output                 |`"Use Markdown with H2 sections, bullet lists, and tables where appropriate."`              |
|Component-first output            |`"For each component, output: name, purpose, anatomy, states, props/variants."`             |
|Token-ready output                |`"Express colors and spacing as named design tokens, not raw values."`                      |

-----

## Example Prompts by Fidelity Level

### Quick brief → High-level spec

```
Write a high-level design spec for a portfolio site for a 3D/UX artist. 
Tone: refined and editorial, not flashy. Dark theme. 
Cover: IA, page list, component list, and typography system only.
Keep it concise — one page of markdown.
```

### Full brief → Production-ready spec

```
You are a senior product designer. Write a full design specification for a 
dashboard web app for internal logistics teams. 

Audience: warehouse ops staff, non-technical, desktop-only.
Core use cases: view shipment status, flag exceptions, generate daily reports.
Aesthetic: utilitarian, high-density data, not corporate SaaS.
Stack: React + Tailwind, no component library.

Include: IA, layout system (grid + breakpoints), full component inventory with 
states, type scale, color tokens (light mode only), spacing scale, 
motion principles, and accessibility requirements (WCAG AA).
Format as structured Markdown with tables for tokens and type scale.
```

-----

## Common Mistakes to Avoid

- **Too vague:** “Make a spec for a website” → output will be generic and useless
- **No aesthetic direction:** Without tone guidance, the LLM defaults to safe, forgettable choices
- **No audience definition:** Leads to specs that don’t reflect real user needs
- **Asking for everything at once without priority:** Ask for sections in order of importance, or in separate passes
- **Not asking for rationale:** Add `"Explain the reasoning behind key design decisions"` to get auditable choices, not just lists

-----

## Iterating on the Spec

After the first output, follow up with targeted prompts:

- `"Expand the component library section with a full state breakdown for each component."`
- `"Rewrite the color system using a token naming convention compatible with Style Dictionary."`
- `"Add a responsive behaviour table for every page template."`
- `"The tone feels too corporate — rewrite the typography and color sections to feel more editorial and raw."`

Treat the first spec as a draft. The LLM works best when you review and redirect iteratively.