# Falling Effect - Backend Implementation Guide

## Overview

The falling effect is a particle animation displayed on the showcase main stage (e.g., falling petals for weddings, confetti for birthdays). It is fully template-driven — each template controls whether an effect is shown, which shape or custom image is used, and how dense it is.

The frontend implementation is complete. This document describes what the backend needs to support it.

---

## 1. Model Changes

Add two fields to the template model (same model that has `cover_stage_layout`):

```python
# EventTemplate / PartnerTemplate model

class FallingEffectType(models.TextChoices):
    PETALS = 'petals', 'Petals'
    CONFETTI = 'confetti', 'Confetti'
    SNOWFLAKES = 'snowflakes', 'Snowflakes'
    STARS = 'stars', 'Stars'
    LEAVES = 'leaves', 'Leaves'
    NONE = 'none', 'None (disabled)'


class FallingEffectColorSource(models.TextChoices):
    PRIMARY = 'primary', 'Primary Color'
    ACCENT = 'accent', 'Accent Color'
    CUSTOM = 'custom', 'Custom Color'


class FallingEffectIntensity(models.TextChoices):
    LIGHT = 'light', 'Light'
    NORMAL = 'normal', 'Normal'
    HEAVY = 'heavy', 'Heavy'


# Add to EventTemplate / PartnerTemplate model:

falling_effect = models.JSONField(
    null=True,
    blank=True,
    default=None,
    help_text=(
        'Falling particle effect configuration (JSON). Set null for no effect. '
        'Format: {"type": "<petals|confetti|snowflakes|stars|leaves|none>", '
        '"color_source": "<primary|accent|custom>", '
        '"custom_color": "<hex e.g. #FFD700>", '
        '"intensity": "<light|normal|heavy>"}. '
        'Only "type" is required. '
        'Example: {"type": "petals", "color_source": "primary", "intensity": "normal"}'
    ),
)

falling_effect_custom_image = models.ImageField(
    upload_to='templates/falling_effects/',
    null=True,
    blank=True,
    help_text=(
        "Custom particle image that overrides the built-in SVG shape. "
        "When set, the image URL is injected as 'custom_image' in the falling_effect response. "
        "Recommended: transparent PNG or SVG, 64-128px, under 20KB."
    ),
)
```

### Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 2. JSON Schema for `falling_effect`

```json
{
  "type": "petals",
  "color_source": "primary",
  "custom_color": null,
  "intensity": "normal"
}
```

### Field Reference

| Field | Type | Required | Default | Allowed Values | Description |
|-------|------|----------|---------|----------------|-------------|
| `type` | string | yes | - | `petals`, `confetti`, `snowflakes`, `stars`, `leaves`, `none` | Built-in particle shape. When `custom_image` is present, this is used for labeling only. |
| `color_source` | string | no | `primary` | `primary`, `accent`, `custom` | Which template color to use for built-in SVG shapes. Ignored for custom images. |
| `custom_color` | string\|null | no | `null` | Hex color (e.g., `#FFD700`) | Only used when `color_source` is `custom`. |
| `intensity` | string | no | `normal` | `light`, `normal`, `heavy` | Controls spawn rate and max particles on screen. |

> **Note:** `custom_image` is NOT stored inside the JSON. It is injected at serialization time from the `falling_effect_custom_image` ImageField (see Section 4).

### Intensity Mapping (frontend reference)

| Intensity | Spawn Interval | Max Particles on Screen |
|-----------|---------------|------------------------|
| `light` | 800ms | 15 |
| `normal` | 500ms | 25 |
| `heavy` | 300ms | 40 |

---

## 3. Serializer / Validation

### Option A: Inline validation in the template serializer

```python
import json

class PartnerTemplateSerializer(serializers.ModelSerializer):
    falling_effect_custom_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = PartnerTemplate
        fields = [..., 'falling_effect', 'falling_effect_custom_image']

    def validate_falling_effect(self, value):
        """Parse JSON string from FormData and validate."""
        if value is None:
            return None

        # FormData sends JSON fields as strings
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format.")

        # Validate required 'type' field
        valid_types = {e.value for e in FallingEffectType}
        effect_type = value.get('type')
        if effect_type not in valid_types:
            raise serializers.ValidationError(
                f"'type' is required and must be one of: {', '.join(sorted(valid_types))}"
            )

        # Validate optional fields
        valid_color_sources = {e.value for e in FallingEffectColorSource}
        color_source = value.get('color_source')
        if color_source and color_source not in valid_color_sources:
            raise serializers.ValidationError(
                f"'color_source' must be one of: {', '.join(sorted(valid_color_sources))}"
            )

        valid_intensities = {e.value for e in FallingEffectIntensity}
        intensity = value.get('intensity')
        if intensity and intensity not in valid_intensities:
            raise serializers.ValidationError(
                f"'intensity' must be one of: {', '.join(sorted(valid_intensities))}"
            )

        # Validate custom_color format if provided
        custom_color = value.get('custom_color')
        if custom_color:
            import re
            if not re.match(r'^#[0-9A-Fa-f]{6}$', custom_color):
                raise serializers.ValidationError(
                    "'custom_color' must be a valid hex color (e.g., '#FFD700')."
                )

        # Strip unknown keys — only store recognized fields
        allowed_keys = {'type', 'color_source', 'custom_color', 'intensity'}
        return {k: v for k, v in value.items() if k in allowed_keys}
```

### Option B: Dedicated serializer (reusable)

```python
class FallingEffectConfigSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=FallingEffectType.choices)
    color_source = serializers.ChoiceField(
        choices=FallingEffectColorSource.choices, required=False, default='primary'
    )
    custom_color = serializers.RegexField(
        regex=r'^#[0-9A-Fa-f]{6}$',
        required=False, allow_null=True, default=None,
        error_messages={'invalid': "Must be a hex color (e.g., '#FFD700')."},
    )
    intensity = serializers.ChoiceField(
        choices=FallingEffectIntensity.choices, required=False, default='normal'
    )
```

---

## 4. Showcase Endpoint

The showcase endpoint (`GET /api/events/{id}/showcase/`) returns `template_assets`. Add `falling_effect` to this object, **injecting the `custom_image` URL** from the ImageField:

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
    }
    return assets

def _build_falling_effect(self, template):
    """
    Build the falling_effect config for the frontend.
    Injects the custom_image URL from the ImageField into the JSON config.
    """
    effect = template.falling_effect
    if not effect:
        return None

    # Copy to avoid mutating the stored JSON
    result = dict(effect)

    # Inject uploaded custom image URL if present
    if template.falling_effect_custom_image:
        result['custom_image'] = template.falling_effect_custom_image.url

    return result
```

### Why `custom_image` is separate from the JSON

The `custom_image` is a file upload (ImageField), not a JSON string. The JSON field stores the config (type, color, intensity), and the image is stored as a regular file field. At serialization time, the backend merges them so the frontend receives a single unified object:

```json
{
  "type": "petals",
  "custom_image": "/media/templates/falling_effects/cherry-blossom.png",
  "color_source": "primary",
  "intensity": "light"
}
```

---

## 5. Partner Template CRUD

The frontend already sends `falling_effect` and `falling_effect_custom_image` in FormData (same pattern as `cover_stage_layout`):

- `falling_effect` → JSON string, e.g., `'{"type":"petals","intensity":"normal"}'`
- `falling_effect_custom_image` → File upload (optional)

Ensure the partner template create/update views handle both:

```python
# In create/update view or serializer
def perform_create(self, serializer):
    # falling_effect is auto-parsed by validate_falling_effect()
    # falling_effect_custom_image is handled by ImageField
    serializer.save(created_by=self.request.user)
```

### Clearing the custom image

To allow partners to remove a custom image, accept `falling_effect_custom_image` as empty string or null:

```python
def validate_falling_effect_custom_image(self, value):
    if value == '':
        return None
    return value
```

---

## 6. Django Admin Configuration

### 6.1 Admin Form with Widget

Create a custom admin form so that admins can configure `falling_effect` using friendly dropdown widgets instead of raw JSON:

```python
# admin_forms.py (or inside admin.py)

from django import forms
from django.core.exceptions import ValidationError
import json


class FallingEffectAdminForm(forms.ModelForm):
    """
    Provides user-friendly widgets for the falling_effect JSONField.
    Admins pick from dropdowns instead of typing raw JSON.
    """

    # Virtual form fields — not on the model, used to build the JSON
    falling_effect_type = forms.ChoiceField(
        choices=[('', '--- No Effect ---')] + list(FallingEffectType.choices),
        required=False,
        label='Falling Effect Type',
        help_text='Select the built-in particle shape. Choose "--- No Effect ---" to disable.',
    )
    falling_effect_color_source = forms.ChoiceField(
        choices=FallingEffectColorSource.choices,
        required=False,
        initial='primary',
        label='Color Source',
        help_text=(
            'primary = uses the template primary color, '
            'accent = uses the template accent color, '
            'custom = uses the custom hex color below.'
        ),
    )
    falling_effect_custom_color = forms.CharField(
        max_length=7,
        required=False,
        label='Custom Color (hex)',
        help_text='Only used when Color Source is "custom". Example: #FFD700',
        widget=forms.TextInput(attrs={'placeholder': '#FFD700', 'style': 'width: 100px;'}),
    )
    falling_effect_intensity = forms.ChoiceField(
        choices=FallingEffectIntensity.choices,
        required=False,
        initial='normal',
        label='Intensity',
        help_text='light = few particles, normal = moderate, heavy = many particles.',
    )

    class Meta:
        # Set this to your actual model in the subclass or when using
        model = None  # Override in subclass
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Pre-populate the virtual fields from the stored JSON
        if self.instance and self.instance.pk and self.instance.falling_effect:
            effect = self.instance.falling_effect
            self.fields['falling_effect_type'].initial = effect.get('type', '')
            self.fields['falling_effect_color_source'].initial = effect.get('color_source', 'primary')
            self.fields['falling_effect_custom_color'].initial = effect.get('custom_color', '')
            self.fields['falling_effect_intensity'].initial = effect.get('intensity', 'normal')

    def clean(self):
        cleaned_data = super().clean()
        effect_type = cleaned_data.get('falling_effect_type')

        if not effect_type or effect_type == '':
            # No effect selected — store null
            cleaned_data['falling_effect'] = None
        else:
            # Build the JSON from the virtual fields
            effect = {'type': effect_type}

            color_source = cleaned_data.get('falling_effect_color_source', 'primary')
            if color_source:
                effect['color_source'] = color_source

            custom_color = cleaned_data.get('falling_effect_custom_color', '').strip()
            if color_source == 'custom' and custom_color:
                import re
                if not re.match(r'^#[0-9A-Fa-f]{6}$', custom_color):
                    raise ValidationError({
                        'falling_effect_custom_color': 'Must be a valid hex color (e.g., #FFD700).'
                    })
                effect['custom_color'] = custom_color

            intensity = cleaned_data.get('falling_effect_intensity', 'normal')
            if intensity:
                effect['intensity'] = intensity

            cleaned_data['falling_effect'] = effect

        return cleaned_data


class EventTemplateAdminForm(FallingEffectAdminForm):
    class Meta:
        model = EventTemplate  # Your actual model
        fields = '__all__'


class PartnerTemplateAdminForm(FallingEffectAdminForm):
    class Meta:
        model = PartnerTemplate  # Your actual model
        fields = '__all__'
```

### 6.2 Admin Model Configuration

```python
# admin.py

from django.contrib import admin
from django.utils.html import format_html


@admin.register(EventTemplate)
class EventTemplateAdmin(admin.ModelAdmin):
    form = EventTemplateAdminForm

    list_display = [
        'id', 'name', 'package_plan',
        'falling_effect_display', 'falling_effect_image_preview',
        'created_at',
    ]
    list_filter = [
        'package_plan__category',
        FallingEffectTypeFilter,       # Custom filter (see Section 6.3)
        FallingEffectEnabledFilter,    # Custom filter (see Section 6.3)
    ]
    search_fields = ['name', 'package_plan__name']
    list_editable = []
    readonly_fields = [
        'falling_effect_preview', 'falling_effect_image_preview',
        'falling_effect_json_display',
    ]

    fieldsets = (
        (None, {
            'fields': ('name', 'package_plan', 'preview_image'),
        }),
        ('Cover Stage Layout', {
            'fields': ('cover_stage_layout',),
            'classes': ('collapse',),
        }),
        ('Falling Effect', {
            'fields': (
                'falling_effect_type',
                'falling_effect_color_source',
                'falling_effect_custom_color',
                'falling_effect_intensity',
                'falling_effect_custom_image',
                'falling_effect_preview',
                'falling_effect_image_preview',
                'falling_effect_json_display',
            ),
            'description': (
                'Configure the falling particle animation for the showcase. '
                'Select a built-in shape or upload a custom image. '
                'Leave "Effect Type" empty to disable the effect.'
            ),
        }),
        # ... other fieldsets ...
    )

    # ── Display helpers ──

    @admin.display(description='Effect')
    def falling_effect_display(self, obj):
        """Show a short summary in list view."""
        if not obj.falling_effect:
            return format_html('<span style="color: #999;">None</span>')

        effect_type = obj.falling_effect.get('type', 'none')
        intensity = obj.falling_effect.get('intensity', 'normal')
        has_custom = bool(obj.falling_effect_custom_image)

        # Emoji indicators for quick scanning
        type_icons = {
            'petals': '🌸', 'confetti': '🎊', 'snowflakes': '❄️',
            'stars': '⭐', 'leaves': '🍃', 'none': '—',
        }
        icon = type_icons.get(effect_type, '?')
        custom_badge = ' 🖼️' if has_custom else ''

        return format_html(
            '{} {} <small style="color: #666;">({})</small>{}',
            icon, effect_type, intensity, custom_badge,
        )

    @admin.display(description='Custom Image')
    def falling_effect_image_preview(self, obj):
        """Show a thumbnail of the custom particle image."""
        if not obj.falling_effect_custom_image:
            return format_html('<span style="color: #999;">—</span>')
        return format_html(
            '<img src="{}" style="max-height: 48px; max-width: 48px; '
            'background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) '
            '50% / 12px 12px; border: 1px solid #ccc; border-radius: 4px;" />',
            obj.falling_effect_custom_image.url,
        )

    @admin.display(description='Falling Effect Preview')
    def falling_effect_preview(self, obj):
        """Detail view: show a readable summary of the current config."""
        if not obj.falling_effect:
            return format_html(
                '<span style="color: #999; font-style: italic;">No falling effect configured.</span>'
            )

        effect = obj.falling_effect
        lines = [
            f'Type: <strong>{effect.get("type", "—")}</strong>',
            f'Intensity: <strong>{effect.get("intensity", "normal")}</strong>',
            f'Color Source: <strong>{effect.get("color_source", "primary")}</strong>',
        ]
        if effect.get('color_source') == 'custom' and effect.get('custom_color'):
            color = effect['custom_color']
            lines.append(
                f'Custom Color: <span style="display: inline-block; width: 14px; height: 14px; '
                f'background: {color}; border: 1px solid #999; border-radius: 2px; '
                f'vertical-align: middle; margin-right: 4px;"></span>'
                f'<code>{color}</code>'
            )
        if obj.falling_effect_custom_image:
            lines.append('Custom Image: <strong>Uploaded</strong> (overrides built-in shape)')

        return format_html('<br>'.join(lines))

    @admin.display(description='Raw JSON')
    def falling_effect_json_display(self, obj):
        """Show the raw stored JSON for debugging."""
        if not obj.falling_effect:
            return format_html('<code>null</code>')
        return format_html(
            '<pre style="background: #f5f5f5; padding: 8px; border-radius: 4px; '
            'font-size: 12px; max-width: 400px;">{}</pre>',
            json.dumps(obj.falling_effect, indent=2),
        )
```

### 6.3 Custom Admin Filters

```python
# admin.py (continued)

class FallingEffectTypeFilter(admin.SimpleListFilter):
    """Filter templates by falling effect type."""
    title = 'falling effect type'
    parameter_name = 'falling_effect_type'

    def lookups(self, request, model_admin):
        return [
            ('none_set', 'No Effect (disabled)'),
            ('not_set', 'Not Configured'),
        ] + list(FallingEffectType.choices)

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'not_set':
            return queryset.filter(falling_effect__isnull=True)
        if value == 'none_set':
            return queryset.filter(falling_effect__type='none')
        if value:
            return queryset.filter(falling_effect__type=value)
        return queryset


class FallingEffectEnabledFilter(admin.SimpleListFilter):
    """Quick filter: has effect vs no effect."""
    title = 'has falling effect'
    parameter_name = 'has_falling_effect'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'Has Effect'),
            ('no', 'No Effect'),
            ('custom', 'Has Custom Image'),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'yes':
            return queryset.filter(
                falling_effect__isnull=False,
            ).exclude(falling_effect__type='none')
        if value == 'no':
            return queryset.filter(
                models.Q(falling_effect__isnull=True) |
                models.Q(falling_effect__type='none')
            )
        if value == 'custom':
            return queryset.exclude(
                falling_effect_custom_image='',
            ).exclude(
                falling_effect_custom_image__isnull=True,
            )
        return queryset
```

### 6.4 Admin Actions (Bulk Operations)

```python
# admin.py (continued) — add to EventTemplateAdmin

    actions = [
        'set_effect_petals',
        'set_effect_confetti',
        'set_effect_snowflakes',
        'set_effect_stars',
        'set_effect_leaves',
        'clear_falling_effect',
    ]

    def _set_effect(self, request, queryset, effect_type, extra=None):
        effect = {'type': effect_type, 'color_source': 'primary', 'intensity': 'normal'}
        if extra:
            effect.update(extra)
        count = queryset.update(falling_effect=effect)
        self.message_user(
            request,
            f'Set falling effect to "{effect_type}" on {count} template(s).',
        )

    @admin.action(description='Set effect: 🌸 Petals (primary color, normal)')
    def set_effect_petals(self, request, queryset):
        self._set_effect(request, queryset, 'petals')

    @admin.action(description='Set effect: 🎊 Confetti (primary color, normal)')
    def set_effect_confetti(self, request, queryset):
        self._set_effect(request, queryset, 'confetti')

    @admin.action(description='Set effect: ❄️ Snowflakes (accent color, light)')
    def set_effect_snowflakes(self, request, queryset):
        self._set_effect(request, queryset, 'snowflakes', {'color_source': 'accent', 'intensity': 'light'})

    @admin.action(description='Set effect: ⭐ Stars (primary color, normal)')
    def set_effect_stars(self, request, queryset):
        self._set_effect(request, queryset, 'stars')

    @admin.action(description='Set effect: 🍃 Leaves (accent color, normal)')
    def set_effect_leaves(self, request, queryset):
        self._set_effect(request, queryset, 'leaves', {'color_source': 'accent'})

    @admin.action(description='Clear falling effect (set to null)')
    def clear_falling_effect(self, request, queryset):
        count = queryset.update(falling_effect=None, falling_effect_custom_image=None)
        self.message_user(request, f'Cleared falling effect on {count} template(s).')
```

### 6.5 Admin Inline for Custom Image Validation

Optional: add image validation to prevent large or wrong-format uploads in admin:

```python
# admin.py or validators.py

from django.core.exceptions import ValidationError
from PIL import Image
import os


def validate_falling_effect_image(image):
    """Validate the custom particle image for admin uploads."""
    # Check file size (20KB max)
    max_size_kb = 20
    if image.size > max_size_kb * 1024:
        raise ValidationError(
            f'Image must be under {max_size_kb}KB. '
            f'Current size: {image.size / 1024:.1f}KB.'
        )

    # Check file extension
    ext = os.path.splitext(image.name)[1].lower()
    allowed_extensions = {'.png', '.svg', '.webp'}
    if ext not in allowed_extensions:
        raise ValidationError(
            f'Allowed formats: {", ".join(allowed_extensions)}. Got: {ext}'
        )

    # Check dimensions for raster images
    if ext in {'.png', '.webp'}:
        try:
            img = Image.open(image)
            width, height = img.size
            if width > 256 or height > 256:
                raise ValidationError(
                    f'Image should be 128x128px or smaller. '
                    f'Current: {width}x{height}px.'
                )
            if width < 16 or height < 16:
                raise ValidationError(
                    f'Image too small. Minimum 16x16px. '
                    f'Current: {width}x{height}px.'
                )
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            raise ValidationError('Could not read image file.')


# Add to the model field:
# falling_effect_custom_image = models.ImageField(
#     ...,
#     validators=[validate_falling_effect_image],
# )
```

---

## 7. Showcase Endpoint

The showcase endpoint (`GET /api/events/{id}/showcase/`) returns `template_assets`. Add `falling_effect` to this object, **injecting the `custom_image` URL** from the ImageField:

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
    }
    return assets

def _build_falling_effect(self, template):
    """
    Build the falling_effect config for the frontend.
    Injects the custom_image URL from the ImageField into the JSON config.
    """
    effect = template.falling_effect
    if not effect:
        return None

    # Copy to avoid mutating the stored JSON
    result = dict(effect)

    # Inject uploaded custom image URL if present
    if template.falling_effect_custom_image:
        result['custom_image'] = template.falling_effect_custom_image.url

    return result
```

### Why `custom_image` is separate from the JSON

The `custom_image` is a file upload (ImageField), not a JSON string. The JSON field stores the config (type, color, intensity), and the image is stored as a regular file field. At serialization time, the backend merges them so the frontend receives a single unified object:

```json
{
  "type": "petals",
  "custom_image": "/media/templates/falling_effects/cherry-blossom.png",
  "color_source": "primary",
  "intensity": "light"
}
```

---

## 8. Partner Template CRUD

The frontend already sends `falling_effect` and `falling_effect_custom_image` in FormData (same pattern as `cover_stage_layout`):

- `falling_effect` → JSON string, e.g., `'{"type":"petals","intensity":"normal"}'`
- `falling_effect_custom_image` → File upload (optional)

Ensure the partner template create/update views handle both:

```python
# In create/update view or serializer
def perform_create(self, serializer):
    # falling_effect is auto-parsed by validate_falling_effect()
    # falling_effect_custom_image is handled by ImageField
    serializer.save(created_by=self.request.user)
```

### Clearing the custom image

To allow partners to remove a custom image, accept `falling_effect_custom_image` as empty string or null:

```python
def validate_falling_effect_custom_image(self, value):
    if value == '':
        return None
    return value
```

---

## 9. Data Migration for Existing Templates

### Option A: Django admin bulk actions

Use the admin actions from Section 6.4 to select templates and assign effects in bulk through the admin UI.

### Option B: Management command

```python
# management/commands/setup_falling_effects.py

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Set default falling effects for templates based on category'

    CATEGORY_EFFECTS = {
        'Wedding': {'type': 'petals', 'color_source': 'primary', 'intensity': 'normal'},
        'Birthday': {'type': 'confetti', 'color_source': 'custom', 'custom_color': '#FFD700', 'intensity': 'heavy'},
        'Holiday': {'type': 'snowflakes', 'color_source': 'accent', 'intensity': 'light'},
        'Gala': {'type': 'stars', 'color_source': 'primary', 'intensity': 'normal'},
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would be changed without saving.',
        )
        parser.add_argument(
            '--overwrite', action='store_true',
            help='Overwrite existing falling_effect values (default: skip).',
        )

    def handle(self, *args, **options):
        from myapp.models import EventTemplate

        dry_run = options['dry_run']
        overwrite = options['overwrite']

        for category_name, effect in self.CATEGORY_EFFECTS.items():
            qs = EventTemplate.objects.filter(
                package_plan__category__name=category_name,
            )
            if not overwrite:
                qs = qs.filter(falling_effect__isnull=True)

            count = qs.count()
            if count == 0:
                self.stdout.write(f'  {category_name}: no templates to update')
                continue

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(f'  {category_name}: would update {count} template(s)')
                )
            else:
                qs.update(falling_effect=effect)
                self.stdout.write(
                    self.style.SUCCESS(f'  {category_name}: updated {count} template(s)')
                )

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDry run complete. No changes made.'))
```

Usage:

```bash
# Preview changes
python manage.py setup_falling_effects --dry-run

# Apply (skip templates that already have an effect)
python manage.py setup_falling_effects

# Apply and overwrite existing effects
python manage.py setup_falling_effects --overwrite
```

### Option C: Data migration

```python
# migrations/XXXX_set_default_falling_effects.py

from django.db import migrations


def set_defaults(apps, schema_editor):
    EventTemplate = apps.get_model('myapp', 'EventTemplate')

    mapping = {
        'Wedding': {'type': 'petals', 'color_source': 'primary', 'intensity': 'normal'},
        'Birthday': {'type': 'confetti', 'color_source': 'custom', 'custom_color': '#FFD700', 'intensity': 'heavy'},
    }

    for category_name, effect in mapping.items():
        EventTemplate.objects.filter(
            package_plan__category__name=category_name,
            falling_effect__isnull=True,
        ).update(falling_effect=effect)


def reverse(apps, schema_editor):
    EventTemplate = apps.get_model('myapp', 'EventTemplate')
    EventTemplate.objects.exclude(falling_effect__isnull=True).update(falling_effect=None)


class Migration(migrations.Migration):
    dependencies = [
        ('myapp', 'XXXX_add_falling_effect_fields'),
    ]

    operations = [
        migrations.RunPython(set_defaults, reverse),
    ]
```

---

## 10. Example Payloads

### Wedding — built-in petals
```json
{"type": "petals", "color_source": "primary", "intensity": "normal"}
```

### Birthday — colorful confetti
```json
{"type": "confetti", "color_source": "custom", "custom_color": "#FFD700", "intensity": "heavy"}
```

### Winter/holiday — snowflakes
```json
{"type": "snowflakes", "color_source": "accent", "intensity": "light"}
```

### Gala — stars
```json
{"type": "stars", "color_source": "primary", "intensity": "normal"}
```

### Premium template — custom uploaded image
```json
{"type": "petals", "intensity": "light"}
```
Plus `falling_effect_custom_image` = uploaded cherry-blossom.png file.
The showcase response will merge them into:
```json
{"type": "petals", "custom_image": "/media/templates/falling_effects/cherry-blossom.png", "intensity": "light"}
```

### No effect
```json
{"type": "none"}
```
Or simply: `null` (no `falling_effect` field).

---

## 11. Frontend Data Flow (for reference)

```
Backend model
  falling_effect (JSONField)        → stored config
  falling_effect_custom_image       → stored file

Showcase API response
  event.template_assets.falling_effect = {
    type, color_source, custom_color, intensity,
    custom_image (injected from ImageField URL)
  }

Frontend
  EventShowcaseRefactored.vue       → passes as :falling-effect prop
  MainContentStage.vue              → passes to <FallingEffect> component
  FallingEffect.vue                 → reads config, resolves color/image
  useFallingParticles.ts            → renders SVG shapes or <img> particles
```

---

## 12. Custom Image Recommendations

Document these for template partners:

| Spec | Recommendation |
|------|---------------|
| Format | PNG with transparency or SVG |
| Dimensions | 64x64 px to 128x128 px |
| File size | Under 20 KB |
| Background | Transparent |
| Design | Simple silhouette or shape that looks good at small sizes and when rotated |

Good examples: cherry blossom petal, maple leaf, small flower, heart, butterfly, musical note.

---

## 13. Backward Compatibility

- If `falling_effect` is `null` or missing from `template_assets`, **no effect is rendered** (safe default).
- Existing templates without this field will show no animation until explicitly configured.
- No migration of existing data is needed beyond adding the database columns.

---

## 14. Quick Checklist

- [ ] Add `falling_effect` JSONField and `falling_effect_custom_image` ImageField to model
- [ ] Run `makemigrations` + `migrate`
- [ ] Add validation in template serializer (`validate_falling_effect`)
- [ ] Add `falling_effect_custom_image` to serializer fields
- [ ] Update `build_template_assets()` in showcase view to include `_build_falling_effect()`
- [ ] Register admin form with friendly dropdowns (Section 6.1-6.2)
- [ ] Add admin filters for effect type and enabled/disabled (Section 6.3)
- [ ] Add admin bulk actions for quick assignment (Section 6.4)
- [ ] Optional: add image validator for custom uploads (Section 6.5)
- [ ] Assign effects to existing templates (admin UI, management command, or data migration)
- [ ] Test showcase endpoint returns `falling_effect` inside `template_assets`
