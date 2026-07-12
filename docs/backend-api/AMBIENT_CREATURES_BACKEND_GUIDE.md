# Ambient Creatures Effect — Backend Implementation Guide

## Overview

The ambient creatures effect renders animated SVG creatures (butterflies, doves, fireflies, dragonflies) that hover around the cover stage decorations. It currently appears only in "basic" display mode (no cover video) with a hardcoded `type: 'mixed'` configuration.

This document describes what the backend needs to support **dynamic, template-driven creature configuration** — allowing admins to control which creature types appear, their relative proportions, sizes, count, speed, and color.

The frontend composable (`useAmbientCreatures.ts`) and component (`AmbientEffect.vue`) are already built. This guide focuses on the backend model, serializer, admin, and showcase endpoint changes needed to make the effect configurable per template.

---

## 1. Model Changes

Add one field to the template model (same model that has `cover_stage_layout` and `falling_effect`):

```python
# EventTemplate / PartnerTemplate model

class AmbientCreatureType(models.TextChoices):
    BUTTERFLY = 'butterfly', 'Butterfly'
    DOVE = 'dove', 'Dove'
    FIREFLY = 'firefly', 'Firefly'
    DRAGONFLY = 'dragonfly', 'Dragonfly'


class AmbientCreatureSpeed(models.TextChoices):
    SLOW = 'slow', 'Slow'
    NORMAL = 'normal', 'Normal'
    FAST = 'fast', 'Fast'


class AmbientCreatureColorSource(models.TextChoices):
    PRIMARY = 'primary', 'Primary Color'
    ACCENT = 'accent', 'Accent Color'
    CUSTOM = 'custom', 'Custom Color'


# Add to EventTemplate / PartnerTemplate model:

ambient_creatures = models.JSONField(
    null=True,
    blank=True,
    default=None,
    help_text=(
        'Ambient creature effect configuration (JSON). Set null for no effect. '
        'Format: {"creatures": [{"type": "<butterfly|dove|firefly|dragonfly>", '
        '"weight": <int>, "min_size": <int>, "max_size": <int>}], '
        '"count": <int>, "speed": "<slow|normal|fast>", '
        '"color_source": "<primary|accent|custom>", "custom_color": "<hex>"}. '
        'Only "creatures" array is required (with at least one entry with "type"). '
        'Example: {"creatures": [{"type": "butterfly", "weight": 2}, '
        '{"type": "firefly", "weight": 3}], "count": 6, "speed": "normal"}'
    ),
)
```

### Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 2. JSON Schema for `ambient_creatures`

### Full example

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 2, "min_size": 20, "max_size": 70 },
    { "type": "firefly", "weight": 3, "min_size": 6, "max_size": 20 },
    { "type": "dove", "weight": 1 }
  ],
  "count": 6,
  "speed": "normal",
  "color_source": "accent",
  "custom_color": null
}
```

### Field Reference

#### Top-level fields

| Field | Type | Required | Default | Allowed Values | Description |
|-------|------|----------|---------|----------------|-------------|
| `creatures` | array | **yes** | — | Array of creature entries (see below) | Which creature types to include and their configuration. At least one entry required. |
| `count` | integer | no | `6` | `1`–`15` | Total number of creatures to spawn on screen. |
| `speed` | string | no | `normal` | `slow`, `normal`, `fast` | Global flight speed preset. |
| `color_source` | string | no | `accent` | `primary`, `accent`, `custom` | Which template color to use for SVG creature fill. |
| `custom_color` | string\|null | no | `null` | Hex color (e.g., `#FFD700`) | Only used when `color_source` is `custom`. |

#### Creature entry fields

| Field | Type | Required | Default | Allowed Values | Description |
|-------|------|----------|---------|----------------|-------------|
| `type` | string | **yes** | — | `butterfly`, `dove`, `firefly`, `dragonfly` | Which creature SVG to render. |
| `weight` | integer | no | `1` | `1`–`10` | Relative spawn weight. Higher = more of this creature type in the mix. |
| `min_size` | integer | no | *(per-type default)* | `4`–`200` | Minimum creature size in pixels. Overrides the built-in default. |
| `max_size` | integer | no | *(per-type default)* | `4`–`200` | Maximum creature size in pixels. Overrides the built-in default. |

#### Built-in size defaults (frontend reference)

| Creature Type | Default `min_size` | Default `max_size` | Speed Multiplier |
|---------------|-------------------|-------------------|-----------------|
| `butterfly` | 20 | 70 | 1.0 |
| `dove` | 25 | 40 | 0.8 |
| `firefly` | 8 | 16 | 0.6 |
| `dragonfly` | 22 | 38 | 1.2 |

#### Speed presets (frontend reference)

| Speed | Base Speed | Wobble Frequency |
|-------|-----------|-----------------|
| `slow` | 0.3 | 0.0012 |
| `normal` | 0.5 | 0.002 |
| `fast` | 0.8 | 0.003 |

### How `weight` works

The `creatures` array defines the weighted spawn pool. When spawning a new creature, the frontend builds a weighted pool from the entries and picks randomly. For example:

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 2 },
    { "type": "firefly", "weight": 3 },
    { "type": "dove", "weight": 1 }
  ],
  "count": 6
}
```

This creates a pool of `[butterfly, butterfly, firefly, firefly, firefly, dove]`. Each spawn picks randomly from this pool. With `count: 6`, you'd get roughly 2 butterflies, 3 fireflies, and 1 dove — but the exact distribution varies due to randomness.

---

## 3. Serializer / Validation

### Option A: Inline validation in the template serializer

```python
import json
import re

class PartnerTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerTemplate
        fields = [..., 'ambient_creatures']

    def validate_ambient_creatures(self, value):
        """Parse JSON string from FormData and validate."""
        if value is None:
            return None

        # FormData sends JSON fields as strings
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format.")

        # ── Validate creatures array ──
        creatures = value.get('creatures')
        if not creatures or not isinstance(creatures, list) or len(creatures) == 0:
            raise serializers.ValidationError(
                "'creatures' is required and must be a non-empty array."
            )

        valid_types = {e.value for e in AmbientCreatureType}
        seen_types = set()
        cleaned_creatures = []

        for i, entry in enumerate(creatures):
            if not isinstance(entry, dict):
                raise serializers.ValidationError(
                    f"creatures[{i}]: each entry must be an object."
                )

            creature_type = entry.get('type')
            if creature_type not in valid_types:
                raise serializers.ValidationError(
                    f"creatures[{i}]: 'type' is required and must be one of: "
                    f"{', '.join(sorted(valid_types))}"
                )

            if creature_type in seen_types:
                raise serializers.ValidationError(
                    f"creatures[{i}]: duplicate type '{creature_type}'. "
                    f"Each creature type can only appear once."
                )
            seen_types.add(creature_type)

            cleaned_entry = {'type': creature_type}

            # Validate weight
            weight = entry.get('weight')
            if weight is not None:
                if not isinstance(weight, int) or weight < 1 or weight > 10:
                    raise serializers.ValidationError(
                        f"creatures[{i}]: 'weight' must be an integer between 1 and 10."
                    )
                cleaned_entry['weight'] = weight

            # Validate min_size
            min_size = entry.get('min_size')
            if min_size is not None:
                if not isinstance(min_size, int) or min_size < 4 or min_size > 200:
                    raise serializers.ValidationError(
                        f"creatures[{i}]: 'min_size' must be an integer between 4 and 200."
                    )
                cleaned_entry['min_size'] = min_size

            # Validate max_size
            max_size = entry.get('max_size')
            if max_size is not None:
                if not isinstance(max_size, int) or max_size < 4 or max_size > 200:
                    raise serializers.ValidationError(
                        f"creatures[{i}]: 'max_size' must be an integer between 4 and 200."
                    )
                cleaned_entry['max_size'] = max_size

            # Validate min_size <= max_size when both provided
            effective_min = cleaned_entry.get('min_size')
            effective_max = cleaned_entry.get('max_size')
            if effective_min is not None and effective_max is not None:
                if effective_min > effective_max:
                    raise serializers.ValidationError(
                        f"creatures[{i}]: 'min_size' ({effective_min}) must be <= "
                        f"'max_size' ({effective_max})."
                    )

            cleaned_creatures.append(cleaned_entry)

        # Max 4 creature entries (one per type)
        if len(cleaned_creatures) > 4:
            raise serializers.ValidationError(
                "Maximum 4 creature entries (one per type)."
            )

        # ── Validate top-level optional fields ──
        cleaned = {'creatures': cleaned_creatures}

        # count
        count = value.get('count')
        if count is not None:
            if not isinstance(count, int) or count < 1 or count > 15:
                raise serializers.ValidationError(
                    "'count' must be an integer between 1 and 15."
                )
            cleaned['count'] = count

        # speed
        valid_speeds = {e.value for e in AmbientCreatureSpeed}
        speed = value.get('speed')
        if speed is not None:
            if speed not in valid_speeds:
                raise serializers.ValidationError(
                    f"'speed' must be one of: {', '.join(sorted(valid_speeds))}"
                )
            cleaned['speed'] = speed

        # color_source
        valid_color_sources = {e.value for e in AmbientCreatureColorSource}
        color_source = value.get('color_source')
        if color_source is not None:
            if color_source not in valid_color_sources:
                raise serializers.ValidationError(
                    f"'color_source' must be one of: "
                    f"{', '.join(sorted(valid_color_sources))}"
                )
            cleaned['color_source'] = color_source

        # custom_color
        custom_color = value.get('custom_color')
        if custom_color:
            if not re.match(r'^#[0-9A-Fa-f]{6}$', custom_color):
                raise serializers.ValidationError(
                    "'custom_color' must be a valid hex color (e.g., '#FFD700')."
                )
            cleaned['custom_color'] = custom_color

        return cleaned
```

### Option B: Dedicated nested serializers (reusable)

```python
class AmbientCreatureEntrySerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=AmbientCreatureType.choices)
    weight = serializers.IntegerField(
        required=False, default=1, min_value=1, max_value=10,
    )
    min_size = serializers.IntegerField(
        required=False, allow_null=True, default=None, min_value=4, max_value=200,
    )
    max_size = serializers.IntegerField(
        required=False, allow_null=True, default=None, min_value=4, max_value=200,
    )

    def validate(self, data):
        min_s = data.get('min_size')
        max_s = data.get('max_size')
        if min_s is not None and max_s is not None and min_s > max_s:
            raise serializers.ValidationError(
                f"'min_size' ({min_s}) must be <= 'max_size' ({max_s})."
            )
        return data


class AmbientCreaturesConfigSerializer(serializers.Serializer):
    creatures = AmbientCreatureEntrySerializer(many=True, min_length=1, max_length=4)
    count = serializers.IntegerField(
        required=False, default=6, min_value=1, max_value=15,
    )
    speed = serializers.ChoiceField(
        choices=AmbientCreatureSpeed.choices, required=False, default='normal',
    )
    color_source = serializers.ChoiceField(
        choices=AmbientCreatureColorSource.choices, required=False, default='accent',
    )
    custom_color = serializers.RegexField(
        regex=r'^#[0-9A-Fa-f]{6}$',
        required=False, allow_null=True, default=None,
        error_messages={'invalid': "Must be a hex color (e.g., '#FFD700')."},
    )

    def validate_creatures(self, creatures):
        types_seen = set()
        for entry in creatures:
            if entry['type'] in types_seen:
                raise serializers.ValidationError(
                    f"Duplicate creature type: '{entry['type']}'. "
                    f"Each type can only appear once."
                )
            types_seen.add(entry['type'])
        return creatures
```

---

## 4. Showcase Endpoint

The showcase endpoint (`GET /api/events/{id}/showcase/`) returns `template_assets`. Add `ambient_creatures` to this object:

```python
def build_template_assets(self, event):
    template = event.event_template
    if not template:
        return None

    assets = {
        # ... existing fields ...
        "cover_stage_layout": template.cover_stage_layout,
        "display_liquid_glass_background": template.display_liquid_glass_background,
        "falling_effect": self._build_falling_effect(template),
        "ambient_creatures": template.ambient_creatures,  # JSON passthrough
    }
    return assets
```

Unlike `falling_effect` which needs custom image injection, `ambient_creatures` is a pure JSON passthrough — all creature rendering is SVG-based with no uploaded assets. The stored JSON is returned as-is.

---

## 5. Partner Template CRUD

The frontend sends `ambient_creatures` as a JSON string in FormData:

- `ambient_creatures` → JSON string, e.g., `'{"creatures":[{"type":"butterfly","weight":2}],"count":6}'`

Ensure the partner template create/update views handle it:

```python
# In create/update view or serializer
def perform_create(self, serializer):
    # ambient_creatures is auto-parsed by validate_ambient_creatures()
    serializer.save(created_by=self.request.user)
```

---

## 6. Django Admin Configuration

### 6.1 Admin Form with Widgets

Create a custom admin form so admins can configure creatures using friendly widgets instead of raw JSON:

```python
# admin_forms.py (or inside admin.py)

from django import forms
from django.core.exceptions import ValidationError
import json


class AmbientCreaturesAdminForm(forms.ModelForm):
    """
    Provides user-friendly widgets for the ambient_creatures JSONField.
    Admins configure creatures via checkboxes and dropdowns.
    """

    # ── Creature type toggles ──
    creature_butterfly = forms.BooleanField(
        required=False, label='🦋 Butterfly',
        help_text='Graceful butterflies with flapping wings.',
    )
    creature_butterfly_weight = forms.IntegerField(
        required=False, initial=1, min_value=1, max_value=10,
        label='Butterfly Weight',
        help_text='Relative spawn frequency (1–10).',
        widget=forms.NumberInput(attrs={'style': 'width: 60px;'}),
    )
    creature_butterfly_min_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Butterfly Min Size (px)',
        help_text='Leave blank for default (20px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '20'}),
    )
    creature_butterfly_max_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Butterfly Max Size (px)',
        help_text='Leave blank for default (70px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '70'}),
    )

    creature_dove = forms.BooleanField(
        required=False, label='🕊️ Dove',
        help_text='Peaceful doves with gentle wing flaps.',
    )
    creature_dove_weight = forms.IntegerField(
        required=False, initial=1, min_value=1, max_value=10,
        label='Dove Weight',
        widget=forms.NumberInput(attrs={'style': 'width: 60px;'}),
    )
    creature_dove_min_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Dove Min Size (px)',
        help_text='Leave blank for default (25px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '25'}),
    )
    creature_dove_max_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Dove Max Size (px)',
        help_text='Leave blank for default (40px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '40'}),
    )

    creature_firefly = forms.BooleanField(
        required=False, label='✨ Firefly',
        help_text='Glowing fireflies with pulsing light.',
    )
    creature_firefly_weight = forms.IntegerField(
        required=False, initial=1, min_value=1, max_value=10,
        label='Firefly Weight',
        widget=forms.NumberInput(attrs={'style': 'width: 60px;'}),
    )
    creature_firefly_min_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Firefly Min Size (px)',
        help_text='Leave blank for default (8px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '8'}),
    )
    creature_firefly_max_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Firefly Max Size (px)',
        help_text='Leave blank for default (16px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '16'}),
    )

    creature_dragonfly = forms.BooleanField(
        required=False, label='🪰 Dragonfly',
        help_text='Swift dragonflies with four translucent wings.',
    )
    creature_dragonfly_weight = forms.IntegerField(
        required=False, initial=1, min_value=1, max_value=10,
        label='Dragonfly Weight',
        widget=forms.NumberInput(attrs={'style': 'width: 60px;'}),
    )
    creature_dragonfly_min_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Dragonfly Min Size (px)',
        help_text='Leave blank for default (22px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '22'}),
    )
    creature_dragonfly_max_size = forms.IntegerField(
        required=False, min_value=4, max_value=200,
        label='Dragonfly Max Size (px)',
        help_text='Leave blank for default (38px).',
        widget=forms.NumberInput(attrs={'style': 'width: 80px;', 'placeholder': '38'}),
    )

    # ── Global settings ──
    ambient_creatures_count = forms.IntegerField(
        required=False, initial=6, min_value=1, max_value=15,
        label='Creature Count',
        help_text='Total number of creatures on screen (1–15).',
        widget=forms.NumberInput(attrs={'style': 'width: 60px;'}),
    )
    ambient_creatures_speed = forms.ChoiceField(
        choices=AmbientCreatureSpeed.choices,
        required=False, initial='normal',
        label='Flight Speed',
        help_text='slow = gentle drift, normal = moderate, fast = lively.',
    )
    ambient_creatures_color_source = forms.ChoiceField(
        choices=AmbientCreatureColorSource.choices,
        required=False, initial='accent',
        label='Color Source',
        help_text=(
            'primary = template primary color, '
            'accent = template accent color, '
            'custom = use hex color below.'
        ),
    )
    ambient_creatures_custom_color = forms.CharField(
        max_length=7, required=False,
        label='Custom Color (hex)',
        help_text='Only used when Color Source is "custom". Example: #FFD700',
        widget=forms.TextInput(attrs={'placeholder': '#FFD700', 'style': 'width: 100px;'}),
    )

    class Meta:
        model = None  # Override in subclass
        fields = '__all__'

    # ── Creature type config for DRY init/clean ──
    CREATURE_TYPES = [
        ('butterfly', 'Butterfly'),
        ('dove', 'Dove'),
        ('firefly', 'Firefly'),
        ('dragonfly', 'Dragonfly'),
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Pre-populate virtual fields from stored JSON
        if self.instance and self.instance.pk and self.instance.ambient_creatures:
            config = self.instance.ambient_creatures
            creatures_by_type = {
                c['type']: c for c in config.get('creatures', [])
            }

            for type_key, _ in self.CREATURE_TYPES:
                if type_key in creatures_by_type:
                    entry = creatures_by_type[type_key]
                    self.fields[f'creature_{type_key}'].initial = True
                    self.fields[f'creature_{type_key}_weight'].initial = (
                        entry.get('weight', 1)
                    )
                    if entry.get('min_size') is not None:
                        self.fields[f'creature_{type_key}_min_size'].initial = (
                            entry['min_size']
                        )
                    if entry.get('max_size') is not None:
                        self.fields[f'creature_{type_key}_max_size'].initial = (
                            entry['max_size']
                        )

            self.fields['ambient_creatures_count'].initial = config.get('count', 6)
            self.fields['ambient_creatures_speed'].initial = config.get('speed', 'normal')
            self.fields['ambient_creatures_color_source'].initial = (
                config.get('color_source', 'accent')
            )
            self.fields['ambient_creatures_custom_color'].initial = (
                config.get('custom_color', '')
            )

    def clean(self):
        cleaned_data = super().clean()

        # Build creatures array from checkboxes
        creatures = []
        for type_key, _ in self.CREATURE_TYPES:
            if cleaned_data.get(f'creature_{type_key}'):
                entry = {'type': type_key}

                weight = cleaned_data.get(f'creature_{type_key}_weight')
                if weight and weight != 1:
                    entry['weight'] = weight

                min_size = cleaned_data.get(f'creature_{type_key}_min_size')
                if min_size is not None:
                    entry['min_size'] = min_size

                max_size = cleaned_data.get(f'creature_{type_key}_max_size')
                if max_size is not None:
                    entry['max_size'] = max_size

                # Validate min <= max
                if min_size is not None and max_size is not None:
                    if min_size > max_size:
                        raise ValidationError({
                            f'creature_{type_key}_min_size': (
                                f'Min size ({min_size}) must be ≤ max size ({max_size}).'
                            )
                        })

                creatures.append(entry)

        if not creatures:
            # No creature types selected — store null (disabled)
            cleaned_data['ambient_creatures'] = None
        else:
            config = {'creatures': creatures}

            count = cleaned_data.get('ambient_creatures_count', 6)
            if count and count != 6:
                config['count'] = count

            speed = cleaned_data.get('ambient_creatures_speed', 'normal')
            if speed and speed != 'normal':
                config['speed'] = speed

            color_source = cleaned_data.get('ambient_creatures_color_source', 'accent')
            if color_source:
                config['color_source'] = color_source

            custom_color = cleaned_data.get(
                'ambient_creatures_custom_color', ''
            ).strip()
            if color_source == 'custom' and custom_color:
                import re
                if not re.match(r'^#[0-9A-Fa-f]{6}$', custom_color):
                    raise ValidationError({
                        'ambient_creatures_custom_color':
                            'Must be a valid hex color (e.g., #FFD700).'
                    })
                config['custom_color'] = custom_color

            cleaned_data['ambient_creatures'] = config

        return cleaned_data


class EventTemplateAdminForm(AmbientCreaturesAdminForm):
    class Meta:
        model = EventTemplate  # Your actual model
        fields = '__all__'


class PartnerTemplateAdminForm(AmbientCreaturesAdminForm):
    class Meta:
        model = PartnerTemplate  # Your actual model
        fields = '__all__'
```

### 6.2 Admin Model Configuration

```python
# admin.py

from django.contrib import admin
from django.utils.html import format_html
import json


@admin.register(EventTemplate)
class EventTemplateAdmin(admin.ModelAdmin):
    form = EventTemplateAdminForm

    list_display = [
        'id', 'name', 'package_plan',
        'ambient_creatures_display',
        'created_at',
    ]
    list_filter = [
        'package_plan__category',
        AmbientCreaturesEnabledFilter,   # Custom filter (see Section 6.3)
        AmbientCreaturesTypeFilter,      # Custom filter (see Section 6.3)
    ]
    search_fields = ['name', 'package_plan__name']
    readonly_fields = [
        'ambient_creatures_preview',
        'ambient_creatures_json_display',
    ]

    fieldsets = (
        (None, {
            'fields': ('name', 'package_plan', 'preview_image'),
        }),
        ('Cover Stage Layout', {
            'fields': ('cover_stage_layout',),
            'classes': ('collapse',),
        }),
        ('Ambient Creatures', {
            'fields': (
                # Creature type toggles with weight/size
                'creature_butterfly',
                'creature_butterfly_weight',
                'creature_butterfly_min_size',
                'creature_butterfly_max_size',
                'creature_dove',
                'creature_dove_weight',
                'creature_dove_min_size',
                'creature_dove_max_size',
                'creature_firefly',
                'creature_firefly_weight',
                'creature_firefly_min_size',
                'creature_firefly_max_size',
                'creature_dragonfly',
                'creature_dragonfly_weight',
                'creature_dragonfly_min_size',
                'creature_dragonfly_max_size',
                # Global settings
                'ambient_creatures_count',
                'ambient_creatures_speed',
                'ambient_creatures_color_source',
                'ambient_creatures_custom_color',
                # Preview / debug
                'ambient_creatures_preview',
                'ambient_creatures_json_display',
            ),
            'description': (
                'Configure ambient creature animations for the cover stage. '
                'Check the creature types to include, set their relative weights, '
                'and optionally override sizes. '
                'Leave all unchecked to disable the effect.'
            ),
        }),
        # ... other fieldsets ...
    )

    # ── Display helpers ──

    @admin.display(description='Creatures')
    def ambient_creatures_display(self, obj):
        """Show a short summary in list view."""
        if not obj.ambient_creatures:
            return format_html('<span style="color: #999;">None</span>')

        config = obj.ambient_creatures
        creatures = config.get('creatures', [])
        count = config.get('count', 6)
        speed = config.get('speed', 'normal')

        type_icons = {
            'butterfly': '🦋',
            'dove': '🕊️',
            'firefly': '✨',
            'dragonfly': '🪰',
        }

        icons = ' '.join(
            f"{type_icons.get(c['type'], '?')}×{c.get('weight', 1)}"
            for c in creatures
        )

        return format_html(
            '{} <small style="color: #666;">({}× {})</small>',
            icons, count, speed,
        )

    @admin.display(description='Creatures Preview')
    def ambient_creatures_preview(self, obj):
        """Detail view: readable summary of the current config."""
        if not obj.ambient_creatures:
            return format_html(
                '<span style="color: #999; font-style: italic;">'
                'No ambient creatures configured.</span>'
            )

        config = obj.ambient_creatures
        creatures = config.get('creatures', [])

        type_icons = {
            'butterfly': '🦋',
            'dove': '🕊️',
            'firefly': '✨',
            'dragonfly': '🪰',
        }

        lines = []
        for c in creatures:
            icon = type_icons.get(c['type'], '?')
            parts = [f'{icon} <strong>{c["type"]}</strong> (weight: {c.get("weight", 1)})']
            if c.get('min_size') or c.get('max_size'):
                min_s = c.get('min_size', 'default')
                max_s = c.get('max_size', 'default')
                parts.append(f'size: {min_s}–{max_s}px')
            lines.append(' — '.join(parts))

        lines.append(f'Count: <strong>{config.get("count", 6)}</strong>')
        lines.append(f'Speed: <strong>{config.get("speed", "normal")}</strong>')
        lines.append(f'Color: <strong>{config.get("color_source", "accent")}</strong>')

        if config.get('color_source') == 'custom' and config.get('custom_color'):
            color = config['custom_color']
            lines.append(
                f'Custom Color: '
                f'<span style="display: inline-block; width: 14px; height: 14px; '
                f'background: {color}; border: 1px solid #999; border-radius: 2px; '
                f'vertical-align: middle; margin-right: 4px;"></span>'
                f'<code>{color}</code>'
            )

        return format_html('<br>'.join(lines))

    @admin.display(description='Raw JSON')
    def ambient_creatures_json_display(self, obj):
        """Show the raw stored JSON for debugging."""
        if not obj.ambient_creatures:
            return format_html('<code>null</code>')
        return format_html(
            '<pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; '
            'font-size: 12px; max-width: 500px;">{}</pre>',
            json.dumps(obj.ambient_creatures, indent=2),
        )
```

### 6.3 Custom Admin Filters

```python
# admin.py (continued)

class AmbientCreaturesEnabledFilter(admin.SimpleListFilter):
    """Quick filter: has creatures vs no creatures."""
    title = 'has ambient creatures'
    parameter_name = 'has_ambient_creatures'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'Has Creatures'),
            ('no', 'No Creatures'),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'yes':
            return queryset.filter(ambient_creatures__isnull=False)
        if value == 'no':
            return queryset.filter(ambient_creatures__isnull=True)
        return queryset


class AmbientCreaturesTypeFilter(admin.SimpleListFilter):
    """Filter by which creature types are included."""
    title = 'creature type'
    parameter_name = 'creature_type'

    def lookups(self, request, model_admin):
        return AmbientCreatureType.choices

    def queryset(self, request, queryset):
        value = self.value()
        if value:
            # JSONField lookup: creatures array contains an entry with this type
            return queryset.filter(
                ambient_creatures__creatures__contains=[{'type': value}]
            )
        return queryset
```

### 6.4 Admin Actions (Bulk Operations)

```python
# admin.py (continued) — add to EventTemplateAdmin

    actions = [
        'set_creatures_butterflies_only',
        'set_creatures_fireflies_only',
        'set_creatures_wedding_mix',
        'set_creatures_garden_mix',
        'set_creatures_evening_mix',
        'clear_ambient_creatures',
    ]

    def _set_creatures(self, request, queryset, config, label):
        count = queryset.update(ambient_creatures=config)
        self.message_user(
            request,
            f'Set ambient creatures to "{label}" on {count} template(s).',
        )

    @admin.action(description='Set creatures: 🦋 Butterflies only (6× normal)')
    def set_creatures_butterflies_only(self, request, queryset):
        self._set_creatures(request, queryset, {
            'creatures': [{'type': 'butterfly', 'weight': 1}],
            'count': 6,
            'speed': 'normal',
            'color_source': 'accent',
        }, 'Butterflies only')

    @admin.action(description='Set creatures: ✨ Fireflies only (8× slow)')
    def set_creatures_fireflies_only(self, request, queryset):
        self._set_creatures(request, queryset, {
            'creatures': [{'type': 'firefly', 'weight': 1}],
            'count': 8,
            'speed': 'slow',
            'color_source': 'accent',
        }, 'Fireflies only')

    @admin.action(description='Set creatures: 🦋🕊️ Wedding mix (butterflies + doves)')
    def set_creatures_wedding_mix(self, request, queryset):
        self._set_creatures(request, queryset, {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dove', 'weight': 1},
            ],
            'count': 5,
            'speed': 'normal',
            'color_source': 'accent',
        }, 'Wedding mix')

    @admin.action(description='Set creatures: 🦋🪰✨ Garden mix (butterflies + dragonflies + fireflies)')
    def set_creatures_garden_mix(self, request, queryset):
        self._set_creatures(request, queryset, {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dragonfly', 'weight': 1},
                {'type': 'firefly', 'weight': 2},
            ],
            'count': 7,
            'speed': 'normal',
            'color_source': 'accent',
        }, 'Garden mix')

    @admin.action(description='Set creatures: ✨🦋 Evening mix (fireflies + butterflies, slow)')
    def set_creatures_evening_mix(self, request, queryset):
        self._set_creatures(request, queryset, {
            'creatures': [
                {'type': 'firefly', 'weight': 3},
                {'type': 'butterfly', 'weight': 1},
            ],
            'count': 8,
            'speed': 'slow',
            'color_source': 'accent',
        }, 'Evening mix')

    @admin.action(description='Clear ambient creatures (set to null)')
    def clear_ambient_creatures(self, request, queryset):
        count = queryset.update(ambient_creatures=None)
        self.message_user(request, f'Cleared ambient creatures on {count} template(s).')
```

---

## 7. Data Migration for Existing Templates

### Option A: Management command

```python
# management/commands/setup_ambient_creatures.py

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Set default ambient creature effects for templates based on category'

    CATEGORY_CREATURES = {
        'Wedding': {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dove', 'weight': 1},
            ],
            'count': 5,
            'speed': 'normal',
            'color_source': 'accent',
        },
        'Birthday': {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dragonfly', 'weight': 1},
                {'type': 'firefly', 'weight': 2},
            ],
            'count': 7,
            'speed': 'normal',
            'color_source': 'primary',
        },
        'Gala': {
            'creatures': [
                {'type': 'firefly', 'weight': 3},
                {'type': 'butterfly', 'weight': 1},
            ],
            'count': 8,
            'speed': 'slow',
            'color_source': 'accent',
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be changed without saving.',
        )
        parser.add_argument(
            '--overwrite', action='store_true',
            help='Overwrite existing ambient_creatures values (default: skip).',
        )

    def handle(self, *args, **options):
        from myapp.models import EventTemplate

        dry_run = options['dry_run']
        overwrite = options['overwrite']

        for category_name, config in self.CATEGORY_CREATURES.items():
            qs = EventTemplate.objects.filter(
                package_plan__category__name=category_name,
            )
            if not overwrite:
                qs = qs.filter(ambient_creatures__isnull=True)

            count = qs.count()
            if count == 0:
                self.stdout.write(f'  {category_name}: no templates to update')
                continue

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'  {category_name}: would update {count} template(s)'
                    )
                )
            else:
                qs.update(ambient_creatures=config)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  {category_name}: updated {count} template(s)'
                    )
                )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nDry run complete. No changes made.')
            )
```

Usage:

```bash
# Preview changes
python manage.py setup_ambient_creatures --dry-run

# Apply (skip templates that already have creatures configured)
python manage.py setup_ambient_creatures

# Apply and overwrite existing configs
python manage.py setup_ambient_creatures --overwrite
```

### Option B: Data migration

```python
# migrations/XXXX_set_default_ambient_creatures.py

from django.db import migrations


def set_defaults(apps, schema_editor):
    EventTemplate = apps.get_model('myapp', 'EventTemplate')

    mapping = {
        'Wedding': {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dove', 'weight': 1},
            ],
            'count': 5,
            'speed': 'normal',
            'color_source': 'accent',
        },
        'Birthday': {
            'creatures': [
                {'type': 'butterfly', 'weight': 2},
                {'type': 'dragonfly', 'weight': 1},
                {'type': 'firefly', 'weight': 2},
            ],
            'count': 7,
            'speed': 'normal',
            'color_source': 'primary',
        },
    }

    for category_name, config in mapping.items():
        EventTemplate.objects.filter(
            package_plan__category__name=category_name,
            ambient_creatures__isnull=True,
        ).update(ambient_creatures=config)


def reverse(apps, schema_editor):
    EventTemplate = apps.get_model('myapp', 'EventTemplate')
    EventTemplate.objects.exclude(
        ambient_creatures__isnull=True
    ).update(ambient_creatures=None)


class Migration(migrations.Migration):
    dependencies = [
        ('myapp', 'XXXX_add_ambient_creatures_field'),
    ]

    operations = [
        migrations.RunPython(set_defaults, reverse),
    ]
```

---

## 8. Example Payloads

### Wedding — butterflies + doves

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 2 },
    { "type": "dove", "weight": 1 }
  ],
  "count": 5,
  "speed": "normal",
  "color_source": "accent"
}
```

### Garden party — diverse mix

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 2, "min_size": 25, "max_size": 50 },
    { "type": "dragonfly", "weight": 1 },
    { "type": "firefly", "weight": 2, "min_size": 6, "max_size": 12 }
  ],
  "count": 7,
  "speed": "normal",
  "color_source": "primary"
}
```

### Evening gala — mostly fireflies (small, slow)

```json
{
  "creatures": [
    { "type": "firefly", "weight": 3, "min_size": 5, "max_size": 10 }
  ],
  "count": 10,
  "speed": "slow",
  "color_source": "custom",
  "custom_color": "#FFD700"
}
```

### Elegant affair — large butterflies only

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 1, "min_size": 40, "max_size": 90 }
  ],
  "count": 3,
  "speed": "slow",
  "color_source": "accent"
}
```

### Nature theme — all four creature types

```json
{
  "creatures": [
    { "type": "butterfly", "weight": 2 },
    { "type": "dove", "weight": 1 },
    { "type": "firefly", "weight": 2 },
    { "type": "dragonfly", "weight": 1 }
  ],
  "count": 8,
  "speed": "normal",
  "color_source": "accent"
}
```

### No effect

Simply: `null` (no `ambient_creatures` field, or set to null).

---

## 9. Frontend Data Flow (for reference)

```
Backend model
  ambient_creatures (JSONField)     → stored config

Showcase API response
  event.template_assets.ambient_creatures = {
    creatures: [{ type, weight, min_size?, max_size? }],
    count, speed, color_source, custom_color?
  }

Frontend
  EventShowcaseRefactored.vue       → passes template_assets to CoverStage
  CoverStage.vue                    → passes showAmbientEffect + config to overlay
  CoverContentOverlay.vue           → renders <AmbientEffect> with config
  AmbientEffect.vue                 → reads config, builds weighted pool
  useAmbientCreatures.ts            → spawns SVG creatures with sizes/speeds from config
```

### Frontend changes (already implemented)

The frontend has been updated to consume the backend config:

1. **`AmbientCreaturesConfig` type** added to `template.types.ts` — defines `creatures` array, `count`, `speed`, `color_source`, `custom_color`.

2. **`EventShowcaseRefactored.vue`** passes `event.template_assets?.ambient_creatures` to `CoverStage`.

3. **`CoverStage.vue`** passes the config through to `CoverContentOverlay` via `:ambient-creatures` prop.

4. **`CoverContentOverlay.vue`** renders `<AmbientEffect>` only when `ambientCreatures` config is present (`v-if="ambientCreatures"`). No hardcoded `type="mixed"` — **no animation by default**.

5. **`AmbientEffect.vue`** accepts a `config: AmbientCreaturesConfig` prop and resolves color based on `color_source`.

6. **`useAmbientCreatures.ts`** builds a weighted spawn pool from the `creatures` array, uses `min_size`/`max_size` overrides per entry (falling back to built-in defaults), and reads `count`/`speed` from the config.

7. **Fallback**: If `ambient_creatures` is `null` or missing from `template_assets`, the effect is not rendered at all.

---

## 10. Backward Compatibility

- If `ambient_creatures` is `null` or missing from `template_assets`, **no creatures are rendered** (safe default).
- Existing templates without this field will show no ambient creatures until explicitly configured via admin or management command.
- No migration of existing data is needed beyond adding the database column.
- The frontend should gracefully handle missing/null values.

---

## 11. Quick Checklist

- [ ] Add `ambient_creatures` JSONField to EventTemplate / PartnerTemplate model
- [ ] Run `makemigrations` + `migrate`
- [ ] Add validation in template serializer (`validate_ambient_creatures`)
- [ ] Update `build_template_assets()` in showcase view to include `ambient_creatures`
- [ ] Register admin form with friendly creature toggles (Section 6.1–6.2)
- [ ] Add admin filters for creatures enabled/type (Section 6.3)
- [ ] Add admin bulk actions for quick presets (Section 6.4)
- [ ] Assign creatures to existing templates (admin UI, management command, or data migration)
- [ ] Test showcase endpoint returns `ambient_creatures` inside `template_assets`
- [x] Frontend: update `AmbientEffect.vue` and `useAmbientCreatures.ts` to consume backend config
- [x] Frontend: remove hardcoded `type="mixed"` from `CoverContentOverlay.vue`
- [x] Frontend: no animation by default — only renders when `ambient_creatures` is present in template_assets
