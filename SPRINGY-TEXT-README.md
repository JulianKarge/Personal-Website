# Springy Text - Physics-Based Wiggly Text Animation

A lightweight, physics-based text animation system that makes headlines interactive and fun! Text wiggles on scroll, has subtle idle animation, and can be grabbed and pulled with realistic spring physics.

## Features

- **Physics-Based Animation**: Realistic spring physics simulation for smooth, natural motion
- **Scroll-Reactive**: Text wiggles and bounces when scrolling past it
- **Grabbable**: Users can click/touch and drag individual letters
- **Idle Wiggle**: Subtle constant animation when idle (optional)
- **Customizable**: Easy configuration via data attributes
- **Responsive**: Works on desktop and mobile with touch support
- **Performance**: Optimized with requestAnimationFrame and CSS transforms
- **Accessible**: Respects `prefers-reduced-motion` for accessibility

## Quick Start

### 1. Include the Files

Add the CSS and JS files to your HTML:

```html
<link rel="stylesheet" href="springy-text.css" />
<script src="springy-text.js" defer></script>
```

### 2. Add the Class

Simply add the `springy-text` class to any text element:

```html
<h1 class="springy-text">Mein neuestes Video</h1>
<h2 class="springy-text">YouTube Meilensteine</h2>
```

That's it! The text will automatically become interactive with wiggly physics.

## Customization

You can customize the physics behavior using data attributes:

```html
<h1
  class="springy-text"
  data-stiffness="0.08"
  data-damping="0.5"
  data-scroll-sensitivity="0.5"
  data-idle-wiggle="true"
  data-idle-wiggle-strength="1.0"
  data-drag-strength="1.2"
>
  Super Bouncy Text
</h1>
```

### Configuration Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-stiffness` | `0.05` | Spring stiffness (0.01-0.1). Higher = bouncier |
| `data-damping` | `0.6` | Dampening factor (0.3-0.9). Lower = more oscillation |
| `data-scroll-sensitivity` | `0.3` | How much scroll affects the text (0.1-1.0) |
| `data-idle-wiggle` | `true` | Enable/disable subtle idle animation |
| `data-idle-wiggle-strength` | `0.5` | Strength of idle wiggle (0.1-2.0) |
| `data-drag-strength` | `0.8` | How far letters move when dragged (0.5-2.0) |

### Preset Styles

Use preset configurations with the `data-preset` attribute:

```html
<!-- Bouncy and elastic -->
<h1 class="springy-text" data-preset="bouncy">Bouncy Text</h1>

<!-- Gentle and smooth -->
<h1 class="springy-text" data-preset="gentle">Gentle Text</h1>

<!-- Very elastic and playful -->
<h1 class="springy-text" data-preset="elastic">Elastic Text</h1>
```

## Advanced Usage

### Programmatic Initialization

You can also initialize the effect programmatically:

```javascript
const element = document.querySelector('.my-headline');
const springyText = new SpringyText(element, {
  stiffness: 0.06,
  damping: 0.65,
  scrollSensitivity: 0.4,
  idleWiggle: true,
  idleWiggleStrength: 0.8,
  dragStrength: 1.0
});
```

### Destroy Instance

To remove the effect and restore original text:

```javascript
springyText.destroy();
```

## How It Works

1. **Text Splitting**: The script splits your text into individual letters, each wrapped in a `<span>` element
2. **Physics Engine**: Each letter has its own physics state (position, velocity, rotation)
3. **Spring Simulation**: Uses spring physics equations to calculate realistic motion
4. **Event Handling**: Listens for scroll, mouse/touch events to apply forces
5. **Animation Loop**: Uses `requestAnimationFrame` for smooth 60fps animation

## Performance Tips

- The animation uses CSS transforms (`translate` and `rotate`) which are GPU-accelerated
- Each letter is optimized with `will-change: transform`
- Idle wiggle calculations are batched in a single animation loop
- Event listeners use passive mode where possible
- Respects `prefers-reduced-motion` for accessibility

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- IE11 not supported (uses modern JavaScript features)

## Examples on Your Site

Currently applied to:
- "Mein neuestes Video" headline ([index.html:198](index.html#L198))
- "YouTube Meilensteine" headline ([index.html:239](index.html#L239))

## Troubleshooting

### Text doesn't wiggle
- Make sure both `springy-text.css` and `springy-text.js` are loaded
- Check browser console for JavaScript errors
- Verify the class `springy-text` is applied to your element

### Too bouncy or not bouncy enough
- Adjust `data-stiffness` (higher = more bounce)
- Adjust `data-damping` (lower = more bounce)

### Performance issues
- Reduce number of springy text elements on page
- Disable `data-idle-wiggle` if needed
- Reduce `data-idle-wiggle-strength`

## License

Free to use for personal and commercial projects.

## Credits

Created for Julian Lucca Karge's personal website.
No external physics libraries required - pure vanilla JavaScript!
