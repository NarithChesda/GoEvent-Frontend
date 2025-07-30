# GoEvent Patterns & Interactions

## Interaction Philosophy

Our interaction patterns create intuitive, delightful user experiences through consistent feedback, smooth animations, and clear visual hierarchies. Every interaction should feel purposeful and provide appropriate feedback to guide users confidently through their tasks.

## Animation Principles

### Motion Guidelines
1. **Purposeful**: Every animation serves a functional purpose
2. **Subtle**: Animations enhance, never distract from content
3. **Fast**: Keep durations short (150-300ms for most interactions)
4. **Consistent**: Use the same easing and timing across similar interactions
5. **Respectful**: Honor `prefers-reduced-motion` settings

### Duration Scale
```css
--duration-instant: 100ms;  /* State changes */
--duration-fast: 150ms;     /* Hover effects */
--duration-normal: 200ms;   /* Button interactions */
--duration-slow: 300ms;     /* Card transitions */
--duration-slower: 500ms;   /* Page transitions */
```

### Easing Functions
```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Most interactions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Exits */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Complex transitions */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful interactions */
```

## Micro-Interactions

### Button Interactions

#### Hover Effects
```css
.btn-micro {
  transition: all var(--duration-normal) var(--ease-out);
}

.btn-micro:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.25);
}

.btn-micro:active {
  transform: translateY(0) scale(0.98);
  transition-duration: var(--duration-fast);
}
```

#### Loading State
```css
.btn-loading {
  position: relative;
  pointer-events: none;
}

.btn-loading .btn-text {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1rem;
  height: 1rem;
  margin: -0.5rem 0 0 -0.5rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Card Interactions

#### Hover Lift Effect
```css
.card-interactive {
  transition: all var(--duration-slow) var(--ease-out);
  transform-origin: center bottom;
}

.card-interactive:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 25