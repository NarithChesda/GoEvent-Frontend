# 🎉 Backend Implementation Note: Ambient Creatures for Birthday Events

## Overview
We've implemented two new **ambient creature types** for birthday event showcase cover stages: **balloons** and **hummingbirds**. These are configurable via the `template_assets.ambient_creatures` field.

## Available Creature Types
The system now supports 6 creature types:
- `butterfly` - Fluttering with erratic movement (existing)
- `dove` - Smooth arcing flight (existing)
- `firefly` - Slow drifting with blinking (existing)
- `dragonfly` - Fast darting with hovering (existing)
- **`balloon`** - Gentle upward float with sway (NEW)
- **`hummingbird`** - Erratic high-energy darting (NEW)

## Configuration Structure
Add this to your `template_assets` response:

```json
{
  "ambient_creatures": {
    "creatures": [
      {
        "type": "balloon",
        "weight": 3,
        "min_size": 24,
        "max_size": 52
      },
      {
        "type": "hummingbird",
        "weight": 2,
        "min_size": 18,
        "max_size": 36
      },
      {
        "type": "firefly",
        "weight": 2
      }
    ],
    "count": 8,
    "speed": "normal",
    "color": "#ff6b9d"
  }
}
```

## Fields Reference
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `creatures` | Array | Array of creature entries with type, weight, and optional size | ✅ Yes |
| `creatures[].type` | String | Creature type: `butterfly`, `dove`, `firefly`, `dragonfly`, `balloon`, `hummingbird` | ✅ Yes |
| `creatures[].weight` | Number | Relative spawn probability (1–10). Default: 1 | ❌ No |
| `creatures[].min_size` | Number | Override default min size in pixels | ❌ No |
| `creatures[].max_size` | Number | Override default max size in pixels | ❌ No |
| `count` | Number | Total creatures on screen (1–15). Default: 6 | ❌ No |
| `speed` | String | `slow`, `normal`, or `fast`. Default: `normal` | ❌ No |
| `color` | String | Hex color for all creatures. Default: `#e91e63` | ❌ No |

## Default Sizes (if not overridden)
```javascript
{
  "balloon": { minSize: 24, maxSize: 52 },
  "hummingbird": { minSize: 18, maxSize: 36 },
  "butterfly": { minSize: 20, maxSize: 70 },
  "dove": { minSize: 25, maxSize: 40 },
  "firefly": { minSize: 8, maxSize: 16 },
  "dragonfly": { minSize: 22, maxSize: 38 }
}
```

## Recommended Birthday Template Config
For optimal birthday celebration feel:

```json
{
  "ambient_creatures": {
    "creatures": [
      { "type": "balloon", "weight": 3 },
      { "type": "hummingbird", "weight": 2 },
      { "type": "firefly", "weight": 1 }
    ],
    "count": 8,
    "speed": "normal",
    "color": "#ff6b9d"
  }
}
```

This creates a playful mix with balloons as the dominant element, hummingbirds for energy, and fireflies for sparkle.

## Frontend Implementation Complete ✅
- ✅ New creature SVG renderers with realistic animations
- ✅ Flight behavior logic (floating, darting)
- ✅ CSS keyframe animations (@keyframes acBalloonFloat, acHummingbirdWingL/R)
- ✅ Depth-based parallax scaling
- ✅ Template form UI integration
- ✅ English & Khmer translations

## Next Steps
1. Add `ambient_creatures` field to your `EventTemplate` model (optional, nullable)
2. Update event template responses to include `ambient_creatures` config
3. Create birthday template with recommended configuration
4. Test with existing showcase pages

## Implementation Details

### Balloon Characteristics
- **Motion**: Continuous upward float with gentle side sway
- **Speed Multiplier**: 0.4x (very slow)
- **Default Size**: 24–52px
- **Use**: Iconic birthday symbol, builds anticipation

### Hummingbird Characteristics
- **Motion**: Erratic darting with rapid direction changes
- **Speed Multiplier**: 1.4x (very fast)
- **Default Size**: 18–36px
- **Use**: Playful energy, high activity level

## Testing Checklist
- [ ] Balloons float upward smoothly without jumping
- [ ] Hummingbirds dart with natural-looking erratic movement
- [ ] Both creatures respect container bounds
- [ ] Color configuration applies correctly to both
- [ ] Size overrides work as expected
- [ ] Weight-based spawn pools distribute creatures correctly
- [ ] Parallax depth scaling is smooth
- [ ] Performance impact is negligible with 8–15 creatures
