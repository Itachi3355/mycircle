# Contributing to MyCircle

Thanks for helping. Developers and designers are both welcome.

## Run it in 30 seconds

No build step, no install. From this folder:

```
python -m http.server 3000
```

Open **http://localhost:3000/?demo**. Demo mode fills the app with sample friends, places and photos, with no sign-in and no database. Saving is disabled there.

To work on sign-in or saving, ask in an issue for access to a test Supabase project.
Run the circle data tests with `node --test tests/circle-data.test.mjs`.

## Where things are

| Area | File |
|---|---|
| Map, panel, sign-in, reviews, photos | `js/app.js` |
| 3D globe view | `js/globe.js` (three.js, loaded only when opened) |
| Styles, light and dark | `css/app.css` |
| Sample data for `?demo` | `js/demo.js` |

## Good ways to help

- **Designers:** look at issues labelled `design`. Mockups, screenshots or a Figma link in the issue are perfect, no code needed.
- **Developers:** issues labelled `good first issue` are small and self-contained.
- Found a bug? Open an issue with steps to reproduce and a screenshot.

## Pull requests

1. Open or comment on an issue first, so two people don't build the same thing.
2. Keep the change focused. Match the surrounding code: plain JavaScript, no new frameworks or packages unless agreed in the issue.
3. Check it in demo mode, on a phone-sized window and in dark mode.
4. Describe what changed and add a screenshot for anything visual.

## Contribution terms

MyCircle is not open source (see `LICENSE`). By submitting a pull request, you confirm the work is your own and you grant Itachi3355 a perpetual, worldwide, royalty-free, irrevocable license to use, modify and distribute your contribution as part of MyCircle. You'll be credited in the pull request history.
