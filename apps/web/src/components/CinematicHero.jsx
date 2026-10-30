import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { MST_NETWORKS } from '@learnquest/shared';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Frame sequence configuration
// ---------------------------------------------------------------------------
// Frames live in apps/web/public/learnquest-cinematic/
// Naming: ezgif-frame-001.jpg ... ezgif-frame-297.jpg
// To replace the animation, keep the same directory/naming convention and
// update TOTAL_FRAMES if the count changes. See docs/CINEMATIC_LANDING.md.
const FRAME_DIR = '/learnquest-cinematic';
const FRAME_PREFIX = 'ezgif-frame-';
const FRAME_EXTENSION = 'jpg';
const FIRST_FRAME = 1;
const TOTAL_FRAMES = 297;

const frameUrl = (index) =>
  `${FRAME_DIR}/${FRAME_PREFIX}${String(index).padStart(3, '0')}.${FRAME_EXTENSION}`;

// Scroll mapping. The camera holds on the frozen character for a short
// interval, then continues through the supplied orbit frames.
const HOLD_START = 0.58;
const HOLD_END = 0.66;
const HOLD_RATIO = 0.58;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function progressToFrame(progress) {
  const p = clamp(progress, 0, 1);
  let ratio;

  if (p <= HOLD_START) {
    ratio = p;
  } else if (p <= HOLD_END) {
    ratio = HOLD_RATIO;
  } else {
    ratio = HOLD_RATIO + ((p - HOLD_END) / (1 - HOLD_END)) * (1 - HOLD_RATIO);
  }

  return clamp(
    Math.round(FIRST_FRAME + ratio * (TOTAL_FRAMES - FIRST_FRAME)),
    FIRST_FRAME,
    TOTAL_FRAMES
  );
}

// Text phases are expressed as normalized scroll progress so they stay in
// sync with the story beats regardless of the exact frame count.
const PHASES = [
  {
    id: '01',
    start: 0,
    end: 0.18,
    label: 'LEARNQUEST // EXPEDITION 001',
    title: 'LEARNQUEST',
    subtitle: 'EVERY SKILL OPENS A NEW WORLD',
    align: 'bottom-left',
  },
  {
    id: '02',
    start: 0.16,
    end: 0.36,
    label: 'PHASE 02 // THE FRACTURE',
    title: 'BREAK YOUR LIMITS.',
    align: 'right',
  },
  {
    id: '03',
    start: 0.32,
    end: 0.58,
    label: 'PHASE 03 // BREAKTHROUGH',
    title: 'LEARN BY PLAYING.',
    body: 'Turn knowledge into quests, challenges, and achievements in an interactive world powered by AI.',
    align: 'left',
  },
  {
    id: '04',
    start: 0.55,
    end: 0.75,
    label: 'PHASE 04 // SUSPENDED',
    title: 'EVERY CHALLENGE MOVES YOU FORWARD.',
    align: 'center',
  },
  {
    id: '05',
    start: 0.75,
    end: 0.9,
    label: 'PHASE 05 // THE WORLD',
    title: 'A WORLD BUILT FOR MASTERY.',
    body: 'Explore floating islands, solve checkpoint challenges, and turn each breakthrough into permanent progress.',
    align: 'right-bottom',
  },
  {
    id: '06',
    start: 0.9,
    end: 1.0001,
    label: 'PHASE 06 // ENTRY',
    title: 'YOUR NEXT LEVEL STARTS HERE.',
    align: 'center',
    cta: true,
  },
];

const ALIGNMENT = {
  'bottom-left': 'items-start justify-end text-left px-5 pb-32 pt-28 sm:px-10 lg:px-16 lg:pb-36 lg:pt-32',
  right: 'items-end justify-center text-right px-5 pt-24 pb-16 sm:px-10 lg:px-16',
  left: 'items-start justify-center text-left px-5 pt-24 pb-16 sm:px-10 lg:px-16',
  center: 'items-center justify-center text-center px-5 sm:px-10',
  'right-bottom': 'items-end justify-end text-right px-5 pb-32 pt-28 sm:px-10 lg:px-16 lg:pb-36 lg:pt-32',
};

// The source footage is monochrome with large white and black areas. Every
// phase gets a directional scrim so the warm palette stays legible regardless
// of which frame is underneath.
const SCRIM = {
  'bottom-left': 'cinematic-scrim-left',
  right: 'cinematic-scrim-right',
  left: 'cinematic-scrim-left',
  center: 'cinematic-scrim-center',
  'right-bottom': 'cinematic-scrim-right',
};

function phaseIndexForProgress(progress) {
  const p = clamp(progress, 0, 1);
  const index = PHASES.findIndex((phase) => p >= phase.start && p < phase.end);
  return index === -1 ? PHASES.length - 1 : index;
}

// ---------------------------------------------------------------------------
// Progressive frame loader
// ---------------------------------------------------------------------------
// Frames are loaded on demand around the current scroll position and cached
// with a bounded LRU-ish window. Evicting far frames keeps memory predictable
// on long sequences while the browser HTTP cache keeps re-loads fast.
function createFrameLoader({ onFrameLoaded, onProgress }) {
  const memory = typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  const saveData = typeof navigator !== 'undefined' && navigator.connection?.saveData;
  const lowMemory = saveData || (memory && memory <= 4) || (cores && cores <= 4);

  const maxCache = lowMemory ? 40 : 96;
  const maxConcurrent = lowMemory ? 3 : 6;

  const cache = new Map();
  const inflight = new Map();
  const queue = [];
  const queued = new Set();

  let current = FIRST_FRAME;
  let disposed = false;
  let loadedCount = 0;

  function evictIfNeeded() {
    if (cache.size <= maxCache) return;

    const keys = [...cache.keys()].sort(
      (a, b) => Math.abs(b - current) - Math.abs(a - current)
    );

    while (cache.size > maxCache && keys.length) {
      const key = keys.shift();
      const image = cache.get(key);
      cache.delete(key);
      if (image) image.src = '';
    }
  }

  function pump() {
    if (disposed) return;

    while (inflight.size < maxConcurrent && queue.length) {
      const index = queue.shift();
      queued.delete(index);
      if (!cache.has(index) && !inflight.has(index)) {
        start(index);
      }
    }
  }

  function start(index) {
    const image = new Image();
    image.decoding = 'async';

    let settled = false;

    const settle = (ok) => {
      if (settled) return;
      settled = true;
      inflight.delete(index);

      if (disposed) return;
      if (ok && image.naturalWidth > 0) {
        cache.set(index, image);
        loadedCount += 1;
        evictIfNeeded();
        onFrameLoaded?.(index);
        onProgress?.(loadedCount);
      }

      pump();
    };

    const decode = () => {
      if (typeof image.decode === 'function') {
        image
          .decode()
          .then(() => settle(true))
          .catch(() => settle(image.complete && image.naturalWidth > 0));
      } else {
        settle(image.complete && image.naturalWidth > 0);
      }
    };

    inflight.set(index, image);

    image.onload = decode;
    image.onerror = () => settle(false);
    image.src = frameUrl(index);

    if (image.complete) {
      decode();
    }
  }

  function request(index, priority = false) {
    const i = clamp(Math.round(index), FIRST_FRAME, TOTAL_FRAMES);

    if (cache.has(i) || inflight.has(i)) return;

    if (queued.has(i)) {
      if (priority) {
        const position = queue.indexOf(i);
        if (position > 0) {
          queue.splice(position, 1);
          queue.unshift(i);
        }
      }
      return;
    }

    if (priority) queue.unshift(i);
    else queue.push(i);

    queued.add(i);
    pump();
  }

  function ensure(index) {
    const i = clamp(Math.round(index), FIRST_FRAME, TOTAL_FRAMES);
    const previous = current;
    current = i;

    request(i, true);

    const direction = i >= previous ? 1 : -1;
    const ahead = lowMemory ? 8 : 20;
    const behind = lowMemory ? 4 : 12;

    for (let distance = 1; distance <= ahead; distance += 1) {
      request(i + distance * direction, distance <= 4);
    }

    for (let distance = 1; distance <= behind; distance += 1) {
      request(i - distance * direction, distance <= 2);
    }
  }

  function preloadInitial(count) {
    for (let index = FIRST_FRAME; index < FIRST_FRAME + count; index += 1) {
      request(index, true);
    }
  }

  function findNearest(index) {
    if (cache.has(index)) {
      return { index, image: cache.get(index) };
    }

    for (let distance = 1; distance <= maxCache; distance += 1) {
      if (cache.has(index - distance)) {
        return { index: index - distance, image: cache.get(index - distance) };
      }
      if (cache.has(index + distance)) {
        return { index: index + distance, image: cache.get(index + distance) };
      }
    }

    return cache.has(FIRST_FRAME)
      ? { index: FIRST_FRAME, image: cache.get(FIRST_FRAME) }
      : null;
  }

  function dispose() {
    disposed = true;
    queue.length = 0;
    queued.clear();
    inflight.clear();

    for (const image of cache.values()) {
      image.src = '';
    }

    cache.clear();
  }

  return { request, ensure, preloadInitial, findNearest, dispose, lowMemory };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CinematicHero({ onStart, onExplore, onOpenAuth }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);
  const frameLabelRef = useRef(null);
  const loaderRef = useRef(null);

  const targetFrameRef = useRef(FIRST_FRAME);
  const drawnFrameRef = useRef(0);
  const rafRef = useRef(0);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [booted, setBooted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  const scheduleDraw = useCallback((draw) => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) return undefined;

    let disposed = false;
    let scrollTrigger;
    let resizeObserver;
    let bootedRef = false;
    let lastProgressUpdate = 0;

    const draw = () => {
      if (disposed) return;

      const loader = loaderRef.current;
      if (!loader) return;

      const found = loader.findNearest(targetFrameRef.current);
      if (!found?.image) return;

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (!displayWidth || !displayHeight) return;

      const bufferWidth = Math.round(displayWidth * dpr);
      const bufferHeight = Math.round(displayHeight * dpr);
      const sizeChanged =
        canvas.width !== bufferWidth || canvas.height !== bufferHeight;

      if (!sizeChanged && drawnFrameRef.current === found.index) return;

      if (sizeChanged) {
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
      }

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      const image = found.image;
      const scale = Math.max(
        bufferWidth / image.naturalWidth,
        bufferHeight / image.naturalHeight
      );
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;

      context.fillStyle = '#07120E';
      context.fillRect(0, 0, bufferWidth, bufferHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(
        image,
        (bufferWidth - drawWidth) / 2,
        (bufferHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      );

      drawnFrameRef.current = found.index;

      if (!bootedRef) {
        bootedRef = true;
        setBooted(true);
      }
    };

    const loader = createFrameLoader({
      onFrameLoaded: () => scheduleDraw(draw),
      onProgress: (count) => {
        const now = performance.now();
        if (now - lastProgressUpdate > 180) {
          lastProgressUpdate = now;
          if (frameLabelRef.current) {
            frameLabelRef.current.dataset.cached = String(count);
          }
        }
      },
    });

    loaderRef.current = loader;

    const initialCount = loader.lowMemory ? 10 : 24;
    loader.request(FIRST_FRAME, true);
    loader.preloadInitial(initialCount);
    scheduleDraw(draw);

    resizeObserver = new ResizeObserver(() => scheduleDraw(draw));
    resizeObserver.observe(canvas);

    if (reducedMotion) {
      const staticFrame = Math.round(TOTAL_FRAMES * HOLD_RATIO);
      targetFrameRef.current = staticFrame;
      if (frameLabelRef.current) {
        frameLabelRef.current.textContent = String(staticFrame).padStart(3, '0');
      }
      loader.request(staticFrame, true);
      loader.request(staticFrame - 1, true);
      loader.request(staticFrame + 1, true);
      setPhaseIndex(3);
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${HOLD_RATIO})`;
      }
      scheduleDraw(draw);

      return () => {
        disposed = true;
        resizeObserver?.disconnect();
        loader.dispose();
        loaderRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      };
    }

    targetFrameRef.current = FIRST_FRAME;

    scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: () =>
        `+=${Math.round(
          window.innerHeight *
            (window.matchMedia('(max-width: 767px)').matches ? 3.2 : 4.2)
        )}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const frame = progressToFrame(self.progress);

        if (frame !== targetFrameRef.current) {
          targetFrameRef.current = frame;
          loader.ensure(frame);
          scheduleDraw(draw);
        }

        const nextPhase = phaseIndexForProgress(self.progress);
        setPhaseIndex((previous) => (previous === nextPhase ? previous : nextPhase));

        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
        }
        if (frameLabelRef.current) {
          frameLabelRef.current.textContent = String(frame).padStart(3, '0');
        }
      },
    });

    ScrollTrigger.refresh();

    return () => {
      disposed = true;
      scrollTrigger?.kill(true);
      resizeObserver?.disconnect();
      loader.dispose();
      loaderRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [reducedMotion, scheduleDraw]);

  const phase = PHASES[phaseIndex];
  const mst = MST_NETWORKS.TESTNET;

  return (
    <section
      ref={containerRef}
      className="relative isolate h-[100svh] min-h-[560px] w-full overflow-hidden bg-cinematic-bg"
      aria-label="LearnQuest cinematic introduction"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="cinematic-vignette pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />
      <div className="cinematic-grid pointer-events-none absolute inset-0 z-[2] opacity-30" aria-hidden="true" />

      {/* Loading state --------------------------------------------------- */}
      {!booted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-cinematic-bg">
          <div className="w-52 border border-cinematic-accent/30 bg-cinematic-deep/40 p-4 font-mono text-[10px] uppercase tracking-[0.25em] text-cinematic-soft">
            <div className="mb-3 flex items-center justify-between">
              <span>Sequence</span>
              <span className="text-cinematic-signal">Loading</span>
            </div>
            <div className="h-px w-full bg-cinematic-accent/20">
              <div className="h-px w-1/2 animate-pulse bg-cinematic-signal" />
            </div>
          </div>
        </div>
      )}



      {/* Story overlays --------------------------------------------------- */}
      {reducedMotion ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-5 text-center">
          <div className="cinematic-scrim-center pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-cinematic-signal">
              Reduced motion // static frame
            </p>
            <h1 className="font-display text-3xl font-black uppercase tracking-[0.04em] text-cinematic-text sm:text-5xl">
              Every challenge moves you forward.
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-body text-sm leading-relaxed text-cinematic-muted sm:text-base">
              The cinematic sequence is paused because your device requests reduced motion.
              Continue into the world to explore the learning experience.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onStart}
                className="px-8 py-3.5 bg-cinematic-signal font-mono text-xs font-bold uppercase tracking-[0.2em] text-cinematic-bg transition-colors hover:bg-cinematic-soft"
              >
                Start Expedition
              </button>
              <button
                type="button"
                onClick={onExplore}
                className="px-8 py-3.5 border border-cinematic-accent/50 font-mono text-xs font-bold uppercase tracking-[0.2em] text-cinematic-soft transition-colors hover:border-cinematic-signal hover:text-cinematic-signal"
              >
                Explore LearnQuest
              </button>
            </div>
          </div>
        </div>
      ) : (
        PHASES.map((item, index) => {
          const active = index === phaseIndex;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 z-10 flex transition-all duration-700 ease-out ${
                ALIGNMENT[item.align]
              } ${
                active
                  ? 'pointer-events-none translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
              aria-hidden={!active}
            >
              <div
                className={`${SCRIM[item.align]} pointer-events-none absolute inset-0`}
                aria-hidden="true"
              />
              <div className="relative z-10 max-w-3xl">
                

                {index === 0 ? (
                  <h1 className="font-display text-5xl font-black uppercase leading-[0.95] tracking-[0.04em] text-cinematic-text sm:text-7xl lg:text-8xl  right-bottom ">
                    {item.title}
                  </h1>
                ) : (
                  <h2 className="font-display text-2xl font-black uppercase leading-tight tracking-[0.03em] text-cinematic-text sm:text-4xl lg:text-5xl ">
                    {item.title}
                  </h2>
                )}

                {item.subtitle && (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-cinematic-soft sm:text-xs  ">
                    {item.subtitle}
                  </p>
                )}

                {item.body && (
                  <p className="mt-5 max-w-lg font-body text-sm leading-relaxed text-cinematic-muted sm:text-base  ">
                    {item.body}
                  </p>
                )}

                {item.cta && (
                  <div className="pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={onStart}
                      tabIndex={active ? 0 : -1}
                      className="px-8 py-3.5 bg-cinematic-signal font-mono text-xs font-bold uppercase tracking-[0.2em] text-cinematic-bg transition-colors hover:bg-cinematic-soft"
                    >
                      Start Expedition
                    </button>
                    <button
                      type="button"
                      onClick={onExplore}
                      tabIndex={active ? 0 : -1}
                      className="px-8 py-3.5 border border-cinematic-accent/50 font-mono text-xs font-bold uppercase tracking-[0.2em] text-cinematic-soft transition-colors hover:border-cinematic-signal hover:text-cinematic-signal"
                    >
                      Explore LearnQuest
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      tabIndex={active ? 0 : -1}
                      className="px-8 py-3.5 border border-cinematic-accent/20 font-mono text-xs font-bold uppercase tracking-[0.2em] text-cinematic-muted transition-colors hover:border-cinematic-accent hover:text-cinematic-text"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

    </section>
  );
}
