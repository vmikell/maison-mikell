# Maison theme mockups

These are drop-in override stylesheets meant to be loaded **after** `index.css` and `App.css` so Victor can feel different color directions before we fully retheme the app.

## Files

- `sunwashed-market.css` — creams, mustards, and teals
- `sage-linen.css` — linen, sage, olive, and walnut
- `clay-hearth.css` — oat, clay, cedar, and espresso

## Quick usage

Temporarily import one of these in `src/main.jsx` after the existing CSS imports:

```js
import './index.css'
import './App.css'
import './theme-mockups/sunwashed-market.css'
```

Swap the file name to preview a different direction.

## Intent

These are not final production themes yet. They are visual mood passes designed to make Maison feel warmer, more human, and less like generic AI purple SaaS.
