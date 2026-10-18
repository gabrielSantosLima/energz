# energz — Design Spec

Source of truth for the visual language of the app. Implementation tokens will
live in a dedicated theme module (`src/theme/`) built from the values below.

## 1. Principles

1. **Clarity first.** One idea per screen, generous whitespace, no decoration
   without purpose.
2. **Flat, not bare.** Solid surfaces, borders and spacing create hierarchy
   instead of heavy shadows or gradients.
3. **One accent.** Brand blue drives actions; solar orange is reserved for
   energy/production meaning. Never compete for attention.
4. **Data is the hero.** Numbers, trends and states are the loudest elements on
   screen — chrome recedes.
5. **Calm motion.** Transitions are quick and subtle; they explain, they don't
   perform.
6. **Consistent in the dark.** Light and dark are equal citizens with the same
   hierarchy and contrast.

## 2. Brand foundation

Derived from the app logo.

| Token | Hex | Use |
| --- | --- | --- |
| brand-navy | `#060915` | Dark canvas, logo base |
| brand-blue | `#0A6BFE` | Primary action, consumption |
| brand-blue-light | `#0982FC` | Blue gradient end, secondary |
| brand-solar | `#FEB317` | Production, accent, highlights |

## 3. Color

Two themes, driven by the system setting. Tokens keep the same names in both.

### 3.1 Neutrals & surfaces

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `background` | `#F6F7F9` | `#060915` | App canvas |
| `surface` | `#FFFFFF` | `#101728` | Cards, sheets, nav bar |
| `surfaceMuted` | `#EEF1F5` | `#0C1220` | Inputs, chips, inset rows |
| `surfaceSelected` | `#E3E8EF` | `#172033` | Selected/active row |
| `border` | `#E4E7EC` | `#1D2740` | Dividers, outlines, inputs |
| `borderStrong` | `#D0D5DD` | `#2A3654` | Emphasized outline |

### 3.2 Text

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `textPrimary` | `#0B0F19` | `#F5F7FA` | Titles, values |
| `textSecondary` | `#5A6172` | `#A6ADBD` | Supporting copy |
| `textTertiary` | `#8A909E` | `#6C7488` | Captions, hints, disabled |

### 3.3 Semantic

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `primary` | `#0A6BFE` | `#3B8BFF` | Primary buttons, links, focus |
| `onPrimary` | `#FFFFFF` | `#04122B` | Content on primary |
| `primaryPressed` | `#0857D6` | `#2E76E0` | Pressed/hover |
| `primarySoft` | `#E7F0FF` | `#12233F` | Tonal fills, badges |
| `accent` | `#FEB317` | `#FEB317` | Production, energy highlights |
| `accentSoft` | `#FFF4DC` | `#2A2410` | Tonal solar fills |
| `success` | `#16A34A` | `#34D399` | Positive net, saved |
| `warning` | `#E08700` | `#FBBF24` | Attention, high usage |
| `danger` | `#E5484D` | `#F87171` | Errors, deficit, destructive |
| `info` | `#0A6BFE` | `#3B8BFF` | Neutral informational |

### 3.4 Data visualization

| Series | Hex | Meaning |
| --- | --- | --- |
| Production (solar) | `#FEB317` → `#FF8A00` | Energy generated |
| Consumption (grid) | `#0A6BFE` → `#0982FC` | Energy consumed |
| Net positive | `#16A34A` | Surplus exported |
| Net negative | `#E5484D` | Deficit imported |
| Gridlines / axis | `border` | Chart scaffolding |

Rules:

- Production and consumption always keep their colors across every chart, badge
  and legend.
- Use fills with ~15% opacity for area charts; strokes stay at full color.
- Never rely on color alone — pair series with labels or icons.

### 3.5 Contrast

- All text pairs meet WCAG AA (4.5:1 body, 3:1 large).
- `textTertiary` is for non-essential text only.

## 4. Typography

Family: **Inter** (via `@expo-google-fonts/inter`), with the platform system
font as fallback before the font loads.

Weights used: `400` Regular, `500` Medium, `600` SemiBold, `700` Bold.

| Token | Size / Line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display` | 32 / 38 | 700 | -0.02em | Hero metric, big screens |
| `title` | 24 / 30 | 700 | -0.01em | Screen titles |
| `heading` | 20 / 26 | 600 | 0 | Section headers |
| `subtitle` | 17 / 24 | 600 | 0 | Card titles |
| `body` | 16 / 24 | 400 | 0 | Default text |
| `bodyStrong` | 16 / 24 | 600 | 0 | Emphasized body |
| `label` | 14 / 20 | 500 | 0 | Buttons, fields, tabs |
| `caption` | 12 / 16 | 500 | 0.01em | Meta, units, hints |

Rules:

- **Metrics** (kWh, currency, percentages) use `tabular-nums` and SemiBold/Bold
  so digits don't jitter when values change.
- Units are rendered in `caption`, `textSecondary`, placed after the number.
- Keep line length readable; avoid more than 3 weights on one screen.

## 5. Spacing & layout

Base unit **4pt**. Only these steps are allowed.

| Token | px |
| --- | --- |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `2xl` | 32 |
| `3xl` | 48 |
| `4xl` | 64 |

- Screen horizontal padding: `lg` (16), `xl` (24) on larger screens.
- Card inner padding: `lg`–`xl`.
- Vertical rhythm between sections: `xl` / `2xl`.
- Minimum touch target: 44×44.

## 6. Shape & radius

Rounded, friendly geometry.

| Token | px | Use |
| --- | --- | --- |
| `radiusSm` | 12 | Chips, small controls |
| `radiusMd` | 16 | Inputs, small cards |
| `radiusLg` | 20 | Buttons, list groups |
| `radiusXl` | 28 | Cards, sheets, modals |
| `radiusPill` | 999 | Pills, tags, avatars |

- Default card radius: `radiusXl` (28).
- Buttons: `radiusLg` (20) or pill for compact actions.
- Never mix more than two radius sizes in a single card.

## 7. Elevation

Flat design with **subtle** shadows. Dark mode prefers borders over shadows.

| Token | Light | Dark |
| --- | --- | --- |
| `elevation0` | none, use `border` | none, use `border` |
| `elevation1` | `0 1 2 rgba(6,9,21,0.06)` | border `#1D2740` |
| `elevation2` | `0 6 16 rgba(6,9,21,0.08)` | border `#2A3654` |

- Elevation 0 is the default for content on the canvas.
- Reserve `elevation2` for floating elements (sheets, FAB, popovers).

## 8. Iconography

- **expo-symbols** (`SymbolView`) with SF Symbols on iOS and a Material fallback
  name for Android/web.
- Sizes: 16 (inline/caption), 20 (default), 24 (navigation), 28 (feature).
- Outline style by default; filled only for active/selected states.
- Icons inherit text color unless they carry meaning (`accent`, `danger`) or are
  inside a tonal container.
- Every icon-only control needs an accessible label.

## 9. Motion

Subtle, purposeful.

| Token | Value |
| --- | --- |
| `durationFast` | 150ms |
| `durationBase` | 250ms |
| `durationSlow` | 400ms |
| `easeStandard` | `cubic-bezier(0.2, 0, 0, 1)` |

- Press feedback: scale to `0.98` or dim to `90%` opacity.
- Value changes (metrics) animate with a short fade/slide, never bounce.
- Screen and modal transitions use the platform default; splash fades out
  (400ms) per `expo-splash-screen` options.
- Respect the OS "reduce motion" setting — fall back to instant.

## 10. Core components (guidelines)

- **Button / Primary:** filled `primary`, `onPrimary` label, height 52, radius
  `radiusLg`, `label` type.
- **Button / Secondary:** `surfaceMuted` fill, `textPrimary` label.
- **Button / Ghost:** transparent, `primary` text, used for low-priority actions.
- **Card:** `surface`, radius `radiusXl`, padding `lg`–`xl`, optional `elevation1`.
- **Input:** `surfaceMuted` fill, `border` on focus → `primary`, height 52,
  radius `radiusMd`, `body` text.
- **List group:** `surface` container, rows separated by 1px `border`.
- **Chip / Tag:** `accentSoft` or `primarySoft` fill, `caption`/`label` text,
  radius `radiusPill`.
- **Metric block:** `caption` label + `display` tabular value + `caption` unit.
- **Bottom navigation:** `surface`, `border` top, active item uses `primary`
  (icon filled + label), inactive uses `textTertiary`.

## 11. Content & language

- All UI copy in English (see `AGENTS.md`).
- Sentence case for labels and titles.
- Numbers: locale-aware formatting; units in `caption`.
- Empty states explain the action, not the absence.

## 12. Accessibility

- Minimum contrast AA everywhere; check both themes.
- Touch targets ≥ 44×44.
- State is never conveyed by color alone.
- Support dynamic type: scale text tokens, don't hard-code pixel heights for
  text containers.

## 13. Next steps

1. Create `src/theme/` with `colors.ts`, `typography.ts`, `spacing.ts`,
   `radius.ts`, `elevation.ts`, `motion.ts` exporting the tokens above.
2. Load Inter with `@expo-google-fonts/inter` and gate the splash screen until
   fonts are ready.
3. Build the core components in `src/components/ui/` against these tokens.
