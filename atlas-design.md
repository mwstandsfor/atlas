# Design Specification: Atlas (Photo Timeline) - Current Implementation

## 1. Project Overview
**Purpose:** Atlas is a localized macOS utility that extracts geolocation metadata from Apple Photos to create a visual, chronological timeline of travel history. It focuses on a high-contrast, "Dark-Mode-First" aesthetic to provide a modern, minimalist journaling experience.

**Primary Interface Goal:** To represent time as a continuous horizontal axis (on desktop) that users can traverse from the present (right) back into the past (left).

---

## 2. Information Architecture
The app is a single-page application with three primary states/views managed via a top navigation bar.

### Page Inventory
1. **Timeline View (Default)**
   - **Axis:** Horizontal scrolling line.
   - **Nodes:** Individual "Visits" represented by dots on the axis.
   - **Headers:** Year and Month markers positioned above the axis.
   - **Interaction:** Infinite scroll to the left (past); clicking a node opens the Detail Panel.
2. **Places View**
   - **Organization:** Hierarchical grouping (Country $\rightarrow$ State $\rightarrow$ City).
   - **Summary:** Total count of unique places and countries.
   - **Interaction:** Right-click/Long-press on a city for a context menu (Rename/Delete).
3. **Place Detail Panel (Overlay)**
   - **Context:** Specific city-level history.
   - **Metrics:** Total number of visits and total days spent.
   - **List:** Chronological list of specific visit date ranges.
4. **Settings Panel (Overlay)**
   - **Sync:** Incremental and Full rebuild triggers.
   - **Config:** Home location (for grouping), custom Photos library path, and Test Mode.

---

## 3. Layout System

### Desktop (macOS)
- **Top Navigation:** A fixed 44px bar containing view tabs and settings.
- **Main Workspace:**
  - **Timeline:** Full-width, horizontally scrollable area. The timeline axis is centered vertically (`50vh`).
  - **Overlays:** Right-side sliding panels (340px - 400px width) for Details and Settings, using a semi-transparent backdrop.

### Mobile/Compact (Adaptive)
- **Timeline Transformation:** The axis switches from horizontal to vertical.
- **Timeline Layout:** The axis moves to the left, and entries stack vertically.
- **Overlay Transformation:** Panels transition from "Slide-from-Right" to "Slide-from-Bottom" (bottom-sheet style).

---

## 4. Component Library

### Timeline Components
- **Timeline Axis:** A 1px solid line extending across the viewport.
- **Visit Node:** A small circle (`--dot-size: 6px`) on the axis.
- **Visit Info:** Text block containing City (Primary), State/Country (Secondary), and Date Range (Muted).
- **Temporal Headers:** 
  - **Year Label:** Large, thin, high-tracking text (e.g., 32px, weight 200).
  - **Month Label:** Small, uppercase, tracked text.

### Places Components
- **Country Section:** Bold header with a border-bottom and a visit count.
- **State Section:** Uppercase, muted header indicating the region.
- **Place Item:** A clickable text label. a hover state highlights the text.
- **Context Menu:** A floating dark surface with "Rename" and "Remove" actions.

### Overlays
- **Panel Backdrop:** `rgba(0, 0, 0, 0.5)` overlay that dims the workspace.
- **Sliding Panel:** A `var(--surface)` background with a 1px border-left, animating via `transform: translateX`.

---

## 5. Typography & Color System

### Color Palette (Onyx Theme)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#0a0a0a` | Main window background |
| `--surface` | `#141414` | Panels, cards, and navbar |
| `--border` | `#222` | Dividers and input borders |
| `--text-primary` | `#e8e8e8` | Main headings and city names |
| `--text-secondary`| `#888` | Secondary labels and state names |
| `--text-muted` | `#555` | Dates and helper text |
| `--line-color` | `#333` | The timeline axis line |

### Typography
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif`.
- **Special Styles:**
  - Year Headers: 32px, weight 200, opacity 0.6 (Ghostly appearance).
  - Month Headers: 11px, uppercase, letter-spacing 1.5px.
  - Body Text: 13px - 14px for general information.

---

## 6. Interaction & Motion Principles

### Navigation & Transitions
- **View Switching:** Immediate toggle of `.hidden` classes between Timeline and Places.
- **Panel Animation:** Uses `transition: transform 0.25s ease` to slide panels into view.
- **Timeline Scrolling:** 
  - **Mouse Wheel:** Intercepted to map `deltaY` (vertical) to `scrollLeft` (horizontal).
  - **Infinite Scroll:** `IntersectionObserver` detects when the `scroll-sentinel` is visible to trigger the next page of data from the API.

### UI Feedback
- **Loading State:** A centered spinner (`animation: spin 0.8s linear infinite`).
- **Refresh State:** Buttons enter a `.refreshing` state where the icon rotates.
- **Edit Mode:** Place items transform from text to an input field inline.
