---
name: ui-design
description: Apply MarkM8 design system. Use when building UI components, updating pages, adding animations, or styling. Covers colors, typography, motion, and component patterns.
---

# MarkM8 UI Design System

## Colors

| Token | Usage |
|-------|-------|
| `primary` | CTAs, links, focus rings |
| `muted` | Backgrounds, disabled states |
| `card` | Card backgrounds |
| `border` | Borders, dividers |

**Grade colors** (by letter):
- A: `green-500/600` | B: `blue-500/600` | C: `yellow-500/600` | D: `orange-500/600` | F: `red-500/600`

## Typography

- Font: Geist Sans (`font-sans`), Geist Mono (`font-mono`)
- Hierarchy: Use `text-2xl font-bold` → `text-lg font-medium` → `text-sm text-muted-foreground`

## Animation (Framer Motion)

**Components** in `src/components/motion/`:

| Component | When to use |
|-----------|-------------|
| `PageTransition` | Wrap page content |
| `FadeIn` | Single element entrance |
| `FadeInStagger` | Parent for staggered children |
| `SlideIn` | Directional entrance (`from="left|right|top|bottom"`) |
| `ScaleIn` | Pop-in effect |
| `StaggerContainer` + `StaggerItem` | Lists, grids |
| `AnimatedNumber` | Counting numbers |

**Timing**: Use `ease: [0.25, 0.1, 0.25, 1]` for smooth transitions. Stagger: 0.08-0.15s between items.

## Component Patterns

**Cards**: Border-left accent for categories
```tsx
<Card className="border-l-4 border-l-green-500">
```

**Empty states**: Use `<EmptyState icon="essays|credits" title="..." description="..." action={{label, href}} />`

**Loading**: Use `<Skeleton className="h-4 w-32" />` or specific patterns (`SkeletonCard`, `SkeletonListItem`)

**Score display**: `<ScoreGauge score={75} size="sm|md|lg" />`

**Step progress**: `<StepIndicator steps={[...]} currentStep={0} />`

## Layout Patterns

**Hero sections**: Gradient background with decorative blurs
```tsx
<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8">
  <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
```

**Stats bar**: Horizontal cards with icon + label + value

**Quick actions**: Grid of cards with icons, hover states (`card-hover` class)

## Do

- Wrap pages in `<PageTransition>`
- Use `StaggerContainer` for lists
- Add `border-l-4 border-l-{color}` for category cards
- Use semantic colors from design tokens
- Progressive disclosure (collapsibles for details)

## Don't

- Raw `useState` for animations (use Framer Motion)
- Hardcoded colors (use tokens)
- Skip loading states
- Animate everything (be selective)

## Reference Files

- `src/styles/global.css` - Design tokens, keyframes, utilities
- `src/components/motion/` - Animation components
- `src/components/ScoreGauge.tsx` - Animated gauge
- `src/features/dashboard/RecentEssaysV2.tsx` - List pattern example
- `src/features/grading/GradeResultsV2.tsx` - Card sections example
