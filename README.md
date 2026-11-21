# Wael Fathy Gaber - Portfolio (static build)

Single-page portfolio: dark mining-GIS theme, animated particle hero,
scroll reveals, animated counters, an interactive satellite project map
(Cairo, New Sohag City, New Administrative Capital), photo lightbox,
and a remote-sensing imagery strip.

## Files

- `index.html` - the whole page
- `style.css` - design system + portfolio theme
- `js.js` - all interactions (canvas animation, reveals, counters, map, lightbox)
- `images/` - photos and project screenshots used by the page
- `fonts/` - web fonts used by the design (loaded by style.css)

## Run it

No build step and no dependencies. Either:

- open `index.html` in a browser, or
- serve the folder: `python3 -m http.server` and visit `http://localhost:8000`

## Publish to GitHub Pages

1. Push all of these files (keep the folder structure) to a repo,
   e.g. `waelfathy27.github.io`.
2. In the repo settings, enable Pages from the root of the main branch.
3. The site is live at `https://waelfathy27.github.io/`.

Everything is local: fonts, images and scripts ship in this zip, so the
page also works fully offline.
