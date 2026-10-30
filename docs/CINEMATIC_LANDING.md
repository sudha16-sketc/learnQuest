# Cinematic Landing Page

The LearnQuest landing page uses a scroll-controlled image sequence for its hero
section. Scrolling down advances the supplied frames; scrolling up reverses
them. GSAP ScrollTrigger pins the hero for the duration of the sequence and the
frames are drawn to a single HTML canvas.

## Frame assets

| Item | Value |
|---|---|
| Directory | `apps/web/public/learnquest-cinematic/` |
| Naming | `ezgif-frame-###.jpg` |
| Zero padding | 3 digits (`001` … `297`) |
| Frame count | `297` |
| Source dimensions | `1918 × 1020` |
| Format | JPEG |

Frames are served from the site root, for example:

```
/learnquest-cinematic/ezgif-frame-001.jpg
/learnquest-cinematic/ezgif-frame-002.jpg
...
/learnquest-cinematic/ezgif-frame-297.jpg
```

## Replacing or adding frames

1. Replace the files in `apps/web/public/learnquest-cinematic/` while keeping the
   same naming scheme.
2. If the total count changes, update `TOTAL_FRAMES` in
   `apps/web/src/components/CinematicHero.jsx`.
3. If the filename prefix, extension, or directory changes, update
   `FRAME_DIR`, `FRAME_PREFIX`, and `FRAME_EXTENSION` in the same file.
4. Keep frames ordered numerically. The loader requests them by index.
5. Rebuild the web app (`npm run build:web`) and verify the first, middle, and
   last frames appear at scroll progress 0, ~0.6, and 1.

The story phases and the brief camera hold are configured in the `PHASES`
array and the `HOLD_START` / `HOLD_END` / `HOLD_RATIO` constants in
`CinematicHero.jsx`. Phase boundaries use normalized scroll progress, not frame
numbers, so they remain aligned if the frame count changes.

## Loading and performance

- The first frame and an initial window are decoded before the canvas is
  revealed.
- Remaining frames load progressively around the current scroll position.
- The decoded-frame cache is bounded (smaller on low-memory devices) and frames
  farthest from the current position are evicted. The browser HTTP cache keeps
  re-loads fast when scrolling in reverse.
- Rendering is driven by `requestAnimationFrame` and only redraws when the
  resolved frame or canvas size changes.
- The canvas uses a device-pixel-ratio buffer capped at `2` to avoid excessive
  memory use on high-density displays.
- `prefers-reduced-motion: reduce` disables pinning and shows a static
  representative frame with the primary calls to action.

## Dependencies

No new packages were added. The hero uses the existing `gsap` dependency
(`gsap/ScrollTrigger`), already declared in `apps/web/package.json`.

## Run and verify

```bash
npm install
npm run dev:web      # http://localhost:3000
npm run build:web    # production build
```

Acceptance checks:

- First frame appears at the top of the page.
- Scrolling down advances frames; scrolling up reverses them immediately.
- The section stays pinned until the final frame, then releases naturally.
- Phase text changes at the intended progress milestones.
- Resizing the viewport keeps the canvas sharp without stretching.
- Reduced-motion mode shows a static hero and remains scrollable.
- No console errors or white flashes during loading.
