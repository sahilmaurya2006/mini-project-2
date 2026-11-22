# REPZONE Athlete Frame Sequence Assets

This directory contains the photographic sequence of an athlete performing dumbbell bicep curls, used by the scroll-controlled animation in `js/scroll-effects.js`.

## Assets Included

- `frame_01.jpg` — Starting position: Athlete standing upright, arms extended at sides holding dumbbells with underhand grip.
- `frame_02.jpg` — Phase 01 / Flexion start: Arms curling upward at ~45-degree angle, initial bicep engagement.
- `frame_03.jpg` — Phase 02 / Mid flexion: Forearms horizontal at 90 degrees parallel to the floor, peak tension.
- `frame_04.jpg` — Phase 03 / Peak contraction: Dumbbells fully raised to shoulder/upper chest level, maximum contraction.

## How to Customize or Expand the Sequence

The scroll-engine in `js/scroll-effects.js` automatically detects all loaded frames and performs sub-frame cross-fading and smooth canvas interpolation.

To supply your own high-density sequence (e.g. 12, 24, 30, or 60 frames):
1. Place standard JPEG or WebP images in this directory named sequentially:
   - `frame_01.jpg`
   - `frame_02.jpg`
   - `frame_03.jpg`
   - ... up to `frame_N.jpg`
2. Update the `FRAME_COUNT` constant in `js/scroll-effects.js` to match your number of frames.
3. For best visual alignment, ensure all frames share the same aspect ratio (4:3 or 16:9 recommended) and consistent lighting.
