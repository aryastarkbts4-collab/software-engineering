# Little Letters — Rebuilt from your uploads

## Open it
1. Extract the ZIP.
2. Open the `Little_Letters_Corrected` folder.
3. Double-click `index.html` in Chrome or Edge.
4. Keep `style.css`, `script.js`, `asset-data.js`, and the `assets` folder alongside `index.html`.

## What's included
- Transparent autumn leaf intro, with working independent Skip button and automatic transition
- Family-focused homepage
- Six letter backgrounds using the supplied **blank** stationery images
- Seven vintage postage stamps using the supplied images
- Six envelope colors and five thread choices
- Editable message, recipient and signature
- Four draggable polaroids with glowing selection and individual captions
- Spotify link attachment
- Envelope opening preview
- Draft saving in this browser
- Self-contained HTML download that embeds the selected paper, stamp and uploaded photos

## Files to edit
- `index.html` — page structure
- `style.css` — layout, colors and animations
- `script.js` — editor and interactions
- `assets/` — stationery, stamps and illustrations
- `asset-data.js` — embedded images for self-contained letter exports (generated file, do not edit manually)

## Limitations
- Spotify links open Spotify; this is not a Spotify account integration.
- The site is a front-end prototype, not a hosted messaging service. You share letters by sending downloaded HTML files.
- Downloaded HTML may use online Google Fonts; fallback fonts render without internet.

## Added for Software Engineering project
- After the existing leaf intro (or Skip), a **Welcome / Log in / Come as guest** screen appears.
- **Log in is a local demo profile**, not real authentication. No password or remote account is created. Real login requires an authentication backend.
- The new **Engineering Studio** navigation opens an independent section with SRS requirements, UML-style use case/state models, actual frontend architecture, interactive Basic COCOMO estimation, smoke tests and iterative development notes.
- Added only `engineering.css` and `engineering.js`, plus the corresponding entry and SE section markup and one intro handoff. The original `style.css`, images, asset-data, stationery, editor and export logic are unchanged.
