# Component Decision Tree

Use this decision tree to select the appropriate component for user input.

## Single Selection (pick one option)

```
How many options?
├── 2 options
│   ├── On/Off or Yes/No → Switch
│   └── Two distinct choices → RadioCard or SegmentedControl
├── 3-5 options
│   ├── Options need description/icon → RadioCard ✓ (preferred)
│   └── Simple text options → Radio buttons
└── 6+ options → Select dropdown
```

## Multiple Selection (pick many options)

```
How many options?
├── 2-6 options → Checkbox group
└── 7+ options → Multi-select with search
```

## Component Usage Rules

| Scenario | Use | Avoid |
|----------|-----|-------|
| Finite choices (3-5) with context | `RadioCard` | `Select` |
| Finite choices (3-5) simple labels | `RadioGroup` | `Select` |
| Many options (6+) | `Select` | `RadioCard` |
| Binary toggle (on/off) | `Switch` | `Checkbox` |
| Binary choice (yes/no with labels) | `RadioCard` | `Switch` |
| Optional single setting | `Checkbox` | `Switch` |
| Form with many fields | `Select` for dropdowns | `RadioCard` (too much space) |

## RadioCard vs Select

**Prefer RadioCard when:**
- 3-5 options that benefit from icons or descriptions
- User needs to see all options at once
- Options have meaningful visual differences
- Space is available

**Prefer Select when:**
- 6+ options
- Options are simple text (no icons/descriptions needed)
- Space is constrained
- Part of a dense form

## Examples

```tsx
// ✓ Good: RadioCard for error handling (3 options with icons + descriptions)
<RadioCardGroup>
  <RadioCard icon={<X />} title="Fail" description="Stop execution" />
  <RadioCard icon={<FastForward />} title="Ignore" description="Continue" />
  <RadioCard icon={<RefreshCw />} title="Retry" description="Try again" />
</RadioCardGroup>

// ✗ Avoid: Select for few important choices
<Select>
  <SelectItem value="fail">Fail</SelectItem>
  <SelectItem value="ignore">Ignore</SelectItem>
  <SelectItem value="retry">Retry</SelectItem>
</Select>

// ✓ Good: Select for many simple options
<Select>
  <SelectItem value="1">1</SelectItem>
  <SelectItem value="2">2</SelectItem>
  ...
  <SelectItem value="10">10</SelectItem>
</Select>
```

## Component Reference

### RadioCard
Location: `src/components/radio-card.tsx`

Props:
- `icon` - React node for the icon
- `iconVariant` - `"default" | "mint" | "gray"`
- `title` - Main label text
- `description` - Secondary description text
- `children` - Expanded content when selected (use `RadioCardContent`)

### RadioCardContent
Wrapper for expanded content inside a RadioCard. Displays only when the card is selected.

### Select
Location: `src/components/ui/select.tsx`

Use for dropdowns with 6+ options or in space-constrained forms.

### Switch
Location: `src/components/ui/switch.tsx`

Use for binary on/off toggles. Not for yes/no choices that need labels.

### Checkbox
Location: `src/components/ui/checkbox.tsx`

Use for optional settings or multi-select scenarios.
