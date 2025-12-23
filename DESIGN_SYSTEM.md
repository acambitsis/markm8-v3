# MarkM8 Design System

> A comprehensive design language for MarkM8 — the AI essay grading platform for university students.
> Inspired by [Scribbr's](https://www.scribbr.com/ai-detector/) academic tool patterns, adapted with MarkM8's distinctive purple brand identity.

---

## Brand Foundation

### Brand Personality

| Attribute | Expression |
|-----------|------------|
| **Friendly** | Approachable robot mascot, warm accent colors, conversational copy |
| **Academic** | Graduation cap motif, clean layouts, credibility signals |
| **Trustworthy** | Clear pricing, transparent grading, university-grade quality |
| **Modern** | Purple palette (not corporate blue), smooth animations, contemporary UI |

### Logo Analysis

The MarkM8 logo uses a **navy-to-purple gradient** with a friendly robot character:

```
"Mark"  →  Dark Navy (#1e1b4b)     - Stability, trust
"M"     →  Medium Purple (#7c3aed) - Transition, creativity
"8"     →  Light Purple (#a78bfa)  - Robot character, friendliness
Faces   →  Peach (#f5c38e)         - Human warmth, approachability
```

---

## 1. Color Palette

### Primary Colors (from logo)

| Name | Hex | HSL | Tailwind | Usage |
|------|-----|-----|----------|-------|
| **Navy** | `#1e1b4b` | `243 47% 20%` | `indigo-950` | Headers, primary text |
| **Purple** | `#7c3aed` | `263 84% 58%` | `violet-500` | Primary buttons, CTAs |
| **Violet** | `#a78bfa` | `258 90% 76%` | `violet-400` | Accents, highlights |
| **Lavender** | `#c4b5fd` | `259 97% 85%` | `violet-300` | Light backgrounds |

### Extended Palette

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Peach** | `#f5c38e` | `34 84% 76%` | Mascot accent, warm highlights |
| **Cream** | `#fef7ed` | `36 100% 96%` | Warm background alternative |
| **Slate** | `#475569` | `215 19% 35%` | Secondary text |
| **Light Gray** | `#f1f5f9` | `210 40% 96%` | Backgrounds, cards |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | `#7c3aed` (violet-500) | `#a78bfa` (violet-400) | Main actions, buttons |
| `--primary-foreground` | `#ffffff` | `#1e1b4b` | Text on primary |
| `--secondary` | `#f1f5f9` (slate-100) | `#1e293b` (slate-800) | Secondary surfaces |
| `--accent` | `#f5c38e` (peach) | `#fbbf24` (amber-400) | Highlights, badges |
| `--muted` | `#64748b` (slate-500) | `#94a3b8` (slate-400) | Subtle text |
| `--destructive` | `#ef4444` (red-500) | `#f87171` (red-400) | Errors, warnings |
| `--success` | `#22c55e` (green-500) | `#4ade80` (green-400) | Success states |
| `--background` | `#ffffff` | `#0f172a` (slate-900) | Page background |
| `--foreground` | `#1e1b4b` (navy) | `#f8fafc` (slate-50) | Primary text |
| `--border` | `#e2e8f0` (slate-200) | `#334155` (slate-700) | Dividers |

### Brand Gradient

```css
/* Primary gradient - matches logo transition */
background: linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #a78bfa 100%);

/* Tailwind classes */
bg-gradient-to-br from-indigo-950 via-violet-500 to-violet-400
```

### CSS Variables (for global.css)

```css
:root {
  /* Brand colors */
  --brand-navy: 243 47% 20%;
  --brand-purple: 263 84% 58%;
  --brand-violet: 258 90% 76%;
  --brand-peach: 34 84% 76%;

  /* Semantic mapping */
  --primary: 263 84% 58%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 243 47% 20%;
  --accent: 34 84% 76%;
  --accent-foreground: 243 47% 20%;
  --muted: 215 16% 47%;
  --muted-foreground: 215 19% 35%;
  --destructive: 0 84% 60%;
  --success: 142 71% 45%;
  --background: 0 0% 100%;
  --foreground: 243 47% 20%;
  --card: 0 0% 100%;
  --card-foreground: 243 47% 20%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 263 84% 58%;
  --radius: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: 258 90% 76%;
    --primary-foreground: 243 47% 20%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --accent: 43 96% 56%;
    --accent-foreground: 243 47% 20%;
    --muted: 217 19% 27%;
    --muted-foreground: 215 20% 65%;
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 217 33% 17%;
    --card-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 258 90% 76%;
  }
}
```

---

## 2. Typography

### Font Stack

```css
/* Primary: Modern, clean sans-serif */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Alternative: More academic feel */
font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
```

### Type Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| **Display** | 4rem (64px) | 800 | 1.1 | -0.02em | Hero headlines |
| **H1** | 3rem (48px) | 700 | 1.2 | -0.02em | Page titles |
| **H2** | 2.25rem (36px) | 700 | 1.25 | -0.01em | Section headers |
| **H3** | 1.5rem (24px) | 600 | 1.3 | 0 | Card titles |
| **H4** | 1.25rem (20px) | 600 | 1.4 | 0 | Subsections |
| **Body Large** | 1.125rem (18px) | 400 | 1.6 | 0 | Lead paragraphs |
| **Body** | 1rem (16px) | 400 | 1.6 | 0 | Default text |
| **Body Small** | 0.875rem (14px) | 400 | 1.5 | 0 | Secondary info |
| **Caption** | 0.75rem (12px) | 500 | 1.4 | 0.01em | Labels, hints |

### Tailwind Classes

```css
/* Display */     text-6xl font-extrabold tracking-tight leading-tight
/* H1 */          text-5xl font-bold tracking-tight leading-tight
/* H2 */          text-4xl font-bold tracking-tight leading-snug
/* H3 */          text-2xl font-semibold leading-snug
/* H4 */          text-xl font-semibold leading-normal
/* Body Large */  text-lg leading-relaxed
/* Body */        text-base leading-relaxed
/* Body Small */  text-sm leading-normal
/* Caption */     text-xs font-medium tracking-wide
```

---

## 3. Spacing System

### Base Unit: 4px (0.25rem)

### Section Spacing

| Element | Mobile | Desktop | Tailwind |
|---------|--------|---------|----------|
| Hero section | 64px top/bottom | 96px | `py-16 lg:py-24` |
| Standard section | 48px | 80px | `py-12 lg:py-20` |
| Between sections | 0 (use section padding) | — | — |
| Section header to content | 32px | 48px | `mb-8 lg:mb-12` |

### Component Spacing

| Element | Size | Tailwind |
|---------|------|----------|
| Card padding | 24px | `p-6` |
| Card gap (grid) | 24px | `gap-6` |
| Form field gap | 16px | `space-y-4` |
| Button group gap | 12px | `gap-3` |
| Inline elements | 8px | `gap-2` |
| Icon to text | 8px | `gap-2` |

### Container Widths

| Container | Max Width | Usage |
|-----------|-----------|-------|
| `max-w-sm` | 24rem (384px) | Narrow cards, inputs |
| `max-w-md` | 28rem (448px) | Forms, small modals |
| `max-w-lg` | 32rem (512px) | Content cards |
| `max-w-xl` | 36rem (576px) | Wide cards |
| `max-w-2xl` | 42rem (672px) | Article content |
| `max-w-4xl` | 56rem (896px) | Main content area |
| `max-w-6xl` | 72rem (1152px) | Page container |
| `max-w-7xl` | 80rem (1280px) | Full-width sections |

---

## 4. Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-sm` | 4px | Small elements, tags |
| `rounded-md` | 6px | Buttons, small inputs |
| `rounded-lg` | 8px | Cards, large inputs |
| `rounded-xl` | 12px | Feature cards, modals |
| `rounded-2xl` | 16px | Hero cards, CTAs |
| `rounded-3xl` | 24px | Large promotional cards |
| `rounded-full` | 9999px | Pills, avatars, badges |

**Default radius:** `--radius: 0.75rem` (12px) — slightly softer than Shadcn default for friendlier feel.

---

## 5. Shadows

| Level | Shadow | Usage |
|-------|--------|-------|
| **xs** | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| **sm** | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards at rest |
| **md** | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | Cards on hover |
| **lg** | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, dropdowns |
| **xl** | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | Elevated elements |
| **purple** | `0 4px 14px rgba(124,58,237,0.25)` | Primary button hover |

### Tailwind Custom Shadow

```css
/* Add to theme */
--shadow-purple: 0 4px 14px rgba(124, 58, 237, 0.25);
--shadow-purple-lg: 0 10px 25px rgba(124, 58, 237, 0.3);
```

---

## 6. Component Specifications

### Buttons

#### Primary Button (CTA)
```
Background: var(--primary) → #7c3aed
Text: white
Height: 48px (touch-friendly)
Padding: 24px horizontal
Border radius: 8px (rounded-lg)
Font: 16px semibold
Shadow: none at rest, shadow-purple on hover
Hover: darken 10%, scale 1.02
Active: darken 15%, scale 0.98
```

#### Secondary Button
```
Background: transparent
Border: 1px solid var(--border)
Text: var(--foreground)
Hover: var(--secondary) background
```

#### Ghost Button
```
Background: transparent
Text: var(--muted-foreground)
Hover: var(--secondary) background
```

### Button Sizes

| Size | Height | Padding | Font Size | Tailwind |
|------|--------|---------|-----------|----------|
| `sm` | 36px | 12px | 14px | `h-9 px-3 text-sm` |
| `md` | 44px | 20px | 16px | `h-11 px-5 text-base` |
| `lg` | 52px | 28px | 18px | `h-13 px-7 text-lg` |

### Form Inputs

#### Text Input
```
Height: 48px (lg) or 40px (default)
Padding: 16px horizontal
Border: 1px solid var(--border)
Border radius: 8px
Background: var(--background)
Focus: 2px ring in var(--ring), border-transparent
Placeholder: var(--muted-foreground)
```

#### Textarea (Essay Input)
```
Min height: 200px (or larger for main tool)
Padding: 16px
Border: 1px solid var(--border)
Border radius: 12px
Background: var(--background)
Focus: 2px ring in var(--ring)
Resize: vertical
Line height: 1.6
Font size: 16px (prevents iOS zoom)
```

### Cards

#### Standard Card
```
Background: var(--card)
Border: 1px solid var(--border)
Border radius: 12px
Padding: 24px
Shadow: shadow-sm
Hover: shadow-md (if interactive)
```

#### Feature Card
```
Background: var(--card)
Border: 1px solid var(--border)
Border radius: 16px
Padding: 32px
Icon: 48px in colored circle
Title: H3 (24px semibold)
Description: Body (16px muted)
```

#### Pricing Card
```
Background: var(--card)
Border: 2px solid var(--border)
Border radius: 16px
Padding: 32px
Featured: border-color var(--primary), shadow-purple
Badge: "Popular" in accent color
```

### Badges

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| Default | `slate-100` | `slate-700` | none |
| Primary | `violet-100` | `violet-700` | none |
| Success | `green-100` | `green-700` | none |
| Warning | `amber-100` | `amber-700` | none |
| Destructive | `red-100` | `red-700` | none |
| Outline | transparent | `foreground` | 1px border |

```
Padding: 4px 10px
Border radius: rounded-full
Font: 12px medium
```

---

## 7. Layout Patterns

### Hero Section (Tool-First, Scribbr-Inspired)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]              [Nav Links]           [Sign In] [CTA]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ⭐⭐⭐⭐⭐ 4.9/5 (2,000+ reviews)        │
│                                                             │
│              Get Your Essay Graded by AI                    │
│                   in Under 5 Minutes                        │
│                                                             │
│         Instant feedback aligned with university            │
│            standards. One credit per essay.                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │   Paste your essay here...                            │  │
│  │                                                       │  │
│  │                                                       │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│              [ Grade My Essay → ]  (Primary CTA)            │
│                                                             │
│           🔒 Your essay is never stored or shared           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         Trusted by students at 500+ universities            │
│         [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Trust Signals Strip

```html
<div class="flex items-center justify-center gap-8 py-6 border-y bg-slate-50">
  <div class="flex items-center gap-2">
    <StarIcon class="text-amber-400" />
    <span class="font-semibold">4.9/5</span>
    <span class="text-muted-foreground">from 2,000+ reviews</span>
  </div>
  <div class="h-4 w-px bg-border" />
  <div class="flex items-center gap-2">
    <ShieldIcon class="text-green-500" />
    <span>Privacy Protected</span>
  </div>
  <div class="h-4 w-px bg-border" />
  <div class="flex items-center gap-2">
    <ClockIcon class="text-violet-500" />
    <span>Results in ~3 minutes</span>
  </div>
</div>
```

### Feature Grid

```
┌──────────────────┬──────────────────┬──────────────────┐
│   ┌──────────┐   │   ┌──────────┐   │   ┌──────────┐   │
│   │   Icon   │   │   │   Icon   │   │   │   Icon   │   │
│   └──────────┘   │   └──────────┘   │   └──────────┘   │
│                  │                  │                  │
│   Feature Title  │   Feature Title  │   Feature Title  │
│                  │                  │                  │
│   Description    │   Description    │   Description    │
│   text here...   │   text here...   │   text here...   │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <FeatureCard icon={...} title="..." description="..." />
</div>
```

### How It Works (3-Step)

```
     Step 1                 Step 2                 Step 3
   ┌────────┐             ┌────────┐             ┌────────┐
   │   1    │  ─────────→ │   2    │  ─────────→ │   3    │
   └────────┘             └────────┘             └────────┘

   Upload Your            AI Grades              Get Detailed
   Essay                  Your Work              Feedback

   Paste or upload        3 AI models analyze    Grade range,
   your essay with        your essay against     strengths,
   the assignment         professional rubric    improvements
   brief                  standards
```

### Pricing Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                 Simple, Pay-Per-Essay Pricing               │
│            No subscriptions. No hidden fees.                │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │               │  │   POPULAR     │  │               │   │
│  │   5 Credits   │  │               │  │  20 Credits   │   │
│  │               │  │  10 Credits   │  │               │   │
│  │     $9.99     │  │               │  │    $34.99     │   │
│  │               │  │    $17.99     │  │               │   │
│  │   $2.00/ea    │  │               │  │   $1.75/ea    │   │
│  │               │  │   $1.80/ea    │  │               │   │
│  │  [ Buy Now ]  │  │               │  │  [ Buy Now ]  │   │
│  │               │  │  [ Buy Now ]  │  │               │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                             │
│            ✓ Credits never expire                           │
│            ✓ Instant delivery                               │
│            ✓ Secure payment via Stripe                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Animation & Motion

### Timing Functions

| Name | Easing | Duration | Usage |
|------|--------|----------|-------|
| **fast** | ease-out | 100ms | Micro-interactions |
| **normal** | ease-out | 150ms | Button hovers |
| **smooth** | ease-in-out | 200ms | Component transitions |
| **slow** | ease-in-out | 300ms | Page transitions |
| **spring** | cubic-bezier(0.34, 1.56, 0.64, 1) | 400ms | Playful bounces |

### Animations

```css
/* Button hover */
.btn-primary {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-purple);
}

/* Card hover */
.card-interactive {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Progress indicator */
@keyframes progress-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 9. Iconography

### Icon Library
Primary: **Lucide React** (consistent with Shadcn)

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `xs` | 14px | Inline with small text |
| `sm` | 16px | Inline with body text |
| `md` | 20px | Buttons, nav items |
| `lg` | 24px | Section icons |
| `xl` | 32px | Feature icons |
| `2xl` | 48px | Hero/feature cards |

### Icon Style Guidelines
- Stroke width: 1.5px (Lucide default)
- Color: inherit from text color
- Feature icons: Place in colored circle background

```html
<!-- Feature icon pattern -->
<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
  <FileTextIcon class="h-6 w-6 text-violet-600" />
</div>
```

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | 0 | Mobile phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Patterns

```css
/* Typography */
text-3xl md:text-4xl lg:text-5xl

/* Layout */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Spacing */
px-4 md:px-6 lg:px-8
py-12 md:py-16 lg:py-24

/* Hidden/shown */
hidden md:flex    /* Hide on mobile */
md:hidden         /* Hide on desktop */
```

---

## 11. Accessibility

### Color Contrast
All text must meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+ or 14px+ bold): 3:1 minimum
- UI components: 3:1 minimum

### Focus States
```css
/* Visible focus ring */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-violet-500
focus-visible:ring-offset-2
```

### Touch Targets
Minimum 44×44px for all interactive elements on mobile.

### Screen Reader
- All images need `alt` text
- Form fields need associated `<label>`
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels for icon-only buttons

---

## 12. Dark Mode

### Implementation
Native CSS media query (automatic):
```css
@media (prefers-color-scheme: dark) { }
```

### Key Adjustments
- Reduce shadow intensity
- Slightly desaturate brand colors
- Increase foreground contrast
- Reverse gradient directions

### Testing Checklist
- [ ] All text readable (contrast check)
- [ ] Brand colors still recognizable
- [ ] Cards have visible boundaries
- [ ] Focus states visible
- [ ] Images/illustrations work in both modes

---

## 13. Design Tokens Summary (Tailwind Config)

```js
// tailwind.config.ts extension ideas (if moving away from CSS-first)
{
  colors: {
    brand: {
      navy: '#1e1b4b',
      purple: '#7c3aed',
      violet: '#a78bfa',
      lavender: '#c4b5fd',
      peach: '#f5c38e',
    }
  },
  borderRadius: {
    DEFAULT: '0.75rem', // 12px - friendlier default
  },
  boxShadow: {
    purple: '0 4px 14px rgba(124, 58, 237, 0.25)',
    'purple-lg': '0 10px 25px rgba(124, 58, 237, 0.3)',
  }
}
```

---

## 14. Page Templates

### Landing Page Structure
1. Navigation (sticky)
2. Hero with tool preview
3. Trust signals strip
4. How it works (3 steps)
5. Features grid
6. Social proof (testimonials)
7. Pricing
8. FAQ
9. Final CTA
10. Footer

### Dashboard Structure
1. Top nav with credits display
2. Sidebar navigation (collapsible on mobile)
3. Main content area
4. Recent grades list
5. Quick actions

### Essay Submission Flow
1. Step indicator (1/3, 2/3, 3/3)
2. Assignment brief input
3. Rubric input/upload
4. Essay content input
5. Review & submit
6. Processing state (with progress)
7. Results display

---

## Quick Reference: Key Classes

```css
/* Brand gradient text */
.text-gradient {
  @apply bg-gradient-to-r from-indigo-950 via-violet-500 to-violet-400
         bg-clip-text text-transparent;
}

/* Primary button */
.btn-primary {
  @apply h-11 px-6 rounded-lg bg-violet-500 text-white font-semibold
         hover:bg-violet-600 hover:shadow-purple
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-violet-500 focus-visible:ring-offset-2
         transition-all duration-150;
}

/* Feature card */
.feature-card {
  @apply p-6 rounded-2xl border border-border bg-card
         hover:shadow-md transition-shadow duration-200;
}

/* Section container */
.section {
  @apply py-16 lg:py-24 px-4 md:px-6;
}

/* Section header */
.section-header {
  @apply mx-auto max-w-2xl text-center mb-12;
}
```

---

## Sources & Inspiration

- [Scribbr AI Detector](https://www.scribbr.com/ai-detector/) — Academic tool UX patterns
- [Shadcn UI](https://ui.shadcn.com/) — Component foundation
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Radix UI](https://www.radix-ui.com/) — Accessible primitives
