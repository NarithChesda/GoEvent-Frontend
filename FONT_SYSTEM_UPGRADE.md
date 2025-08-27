# Font System Upgrade - New Font Type Support

This document describes the backward-compatible upgrade to the template font system that now supports comprehensive font type classification.

## What Changed

### Updated Interface
```typescript
export interface TemplateFont {
  id?: number
  language: string
  font_name: string  // Legacy field, still supported
  font_file?: string // Legacy field, still supported
  // New font type fields for backward compatibility
  font_type?: string // 'primary', 'secondary', 'accent', 'decorative'
  font_type_display?: string // 'Primary', 'Secondary', 'Accent', 'Decorative'
  font?: {
    name: string
    font_file: string
  }
}
```

### New Font Types Available
- **Primary Font**: For headings and important text (previously only available)
- **Secondary Font**: For body text and descriptions (previously only available)
- **Accent Font**: For special highlights and emphasized text (NEW)
- **Decorative Font**: For artistic elements like invitations and special sections (NEW)

### New Computed Properties in useEventShowcase
```typescript
const accentFont = computed(() => {...})      // NEW
const decorativeFont = computed(() => {...})  // NEW
const getLanguageFonts = computed(() => {...}) // Enhanced with font type mapping
```

## How Font Selection Works (Backward Compatible)

1. **First Priority**: Use the new `font_type` field if available
2. **Second Priority**: Fall back to name-based detection (legacy behavior)
3. **Third Priority**: Use ID-based ordering for remaining fonts
4. **Fallback Strategy**: Ensure all font types have values by using fallbacks

## API Response Examples

### New Format (Recommended)
```json
{
  "fonts": [
    {
      "id": 1,
      "language": "en",
      "font_type": "primary",
      "font_type_display": "Primary",
      "font": {
        "name": "Roboto Bold",
        "font_file": "/media/fonts/roboto-bold.woff2"
      }
    },
    {
      "id": 2,
      "language": "en",
      "font_type": "decorative",
      "font_type_display": "Decorative",
      "font": {
        "name": "Dancing Script",
        "font_file": "/media/fonts/dancing-script.woff2"
      }
    }
  ]
}
```

### Legacy Format (Still Supported)
```json
{
  "fonts": [
    {
      "id": 1,
      "language": "en",
      "font_name": "Roboto Primary Bold",
      "font_file": "/media/fonts/roboto-primary.woff2"
    }
  ]
}
```

## Usage in Components

### Before (Limited to Primary/Secondary)
```vue
<template>
  <h1 :style="{ fontFamily: primaryFont }">Wedding Title</h1>
  <p :style="{ fontFamily: secondaryFont }">Event description...</p>
</template>
```

### After (Full Font Type Support)
```vue
<template>
  <h1 :style="{ fontFamily: primaryFont }">Wedding Title</h1>
  <p :style="{ fontFamily: secondaryFont }">Event description...</p>
  <span :style="{ fontFamily: accentFont }">Save the Date!</span>
  <div :style="{ fontFamily: decorativeFont }">♥ Invitation ♥</div>
</template>

<script setup>
const { primaryFont, secondaryFont, accentFont, decorativeFont } = useEventShowcase()
</script>
```

### Enhanced Component Props
Components can now receive all font types:
```vue
<HostInfo
  :primary-font="primaryFont"
  :secondary-font="secondaryFont"
  :accent-font="accentFont"
  :decorative-font="decorativeFont"
/>
```

## Benefits

1. **Enhanced Typography**: More expressive font combinations for wedding invitations
2. **Backward Compatibility**: Existing templates continue to work without changes
3. **Progressive Enhancement**: New templates can take advantage of richer typography
4. **Graceful Fallbacks**: Missing font types automatically fall back to available fonts
5. **Mixed API Support**: Works with both new and legacy API responses

## Migration Path

### For Existing Templates
- No changes required - existing templates continue to work
- Legacy font selection logic remains functional
- Gradual migration to new font type system possible

### For New Templates
- Use the new `font_type` field for explicit font classification
- Take advantage of accent and decorative fonts for richer designs
- Nested font structure provides cleaner API responses

## Implementation Details

The font system upgrade maintains full backward compatibility while providing enhanced functionality. Font loading logic has been updated to handle both legacy (`font_name`/`font_file`) and new nested (`font.name`/`font.font_file`) structures seamlessly.

Font type detection follows a priority system ensuring that new templates get precise font type assignments while legacy templates maintain their name-based detection behavior.