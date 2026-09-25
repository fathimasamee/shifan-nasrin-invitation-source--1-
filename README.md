# Shifan & Nasrin — Wedding Invitation Website

## Files
- index.html   — page structure
- style.css    — all styling & animations
- script.js    — countdown, envelope-open, scratch-reveal, music, config, sound effects
- assets/envelope.jpg — your uploaded envelope photo

## Sound effects (built-in, no files needed)
All sounds are generated live in the browser with the Web Audio API — nothing to
upload, and they work instantly on any device:
- Background music: a soft looping ambient chord starts the moment the envelope opens.
- Scratch sound: a paper-like texture sound plays while the guest scratches the gold panel, and its pitch rises with scratch speed.
- Reveal chime: a bright rising sparkle chime plays the instant the date is fully revealed, together with the petal-pop animation and the "Date Revealed" popup card.
- The speaker button (bottom-right) mutes/unmutes the background sound at any time.

To use your OWN real music track instead of the generated ambient pad:
1. Add an mp3 file into the assets/ folder, e.g. assets/music.mp3
2. In script.js set: musicSrc: "assets/music.mp3"
   (once musicSrc is set, that file plays instead of the synthesized pad —
   the scratch sound and reveal chime always stay as built-in effects)

## To edit wedding details
Open script.js and edit the CONFIG object at the top:
- groom / bride names
- weddingISO (date + time, used for countdown)
- dateDisplay / timeDisplay (shown as text)
- venueName / venueAddress (used for the map + directions)
- mapsDirectionsLink (Google Maps link for the "Get Directions" button)
- message (the invitation paragraph)
- musicSrc (path/URL to a real mp3 — leave "" to use the built-in ambient sound)

## To replace the venue background
Currently a soft navy/gold gradient (no venue photo was supplied).
To use a real photo, open style.css, find ".bg-zoom", and add:
  background-image: url('assets/your-photo.jpg');
  background-size: cover; background-position:center;
(keep the animation: kenburns line for the zoom effect)

## Hosting
This is a static site — upload the whole folder to any static host
(Netlify, Vercel, GitHub Pages, or your own server). No build step needed.
