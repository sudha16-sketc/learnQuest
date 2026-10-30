import React, { useEffect, useRef, useState } from 'react';
import CinematicHero from '../components/CinematicHero';
import { MST_NETWORKS, XP_ECONOMY } from '@learnquest/shared';
import {
  IconPlay,
  IconCpu,
  IconCoins,
  IconAward,
  IconShieldCheck,
  IconCompass,
  IconLayers,
  IconTrendingUp,
  IconArrowRight,
  IconExternalLink
} from '../components/Icons';

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShown(true);
      return undefined;
    }

    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ index, children }) {
  return (
    <div className="mb-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-cinematic-muted">
      <span className="text-cinematic-signal">{index}</span>
      <span className="h-px w-8 bg-cinematic-accent/40" />
      <span>{children}</span>
    </div>
  );
}

const EXPERIENCE_CARDS = [
  {
    icon: IconCompass,
    title: 'Quest-driven progression',
    copy:
      'Move through floating islands where every platform, checkpoint, and challenge is part of a structured learning path.'
  },
  {
    icon: IconCpu,
    title: 'AI-generated challenges',
    copy:
      'Gemini-powered checkpoints adapt to the selected topic and difficulty, with schema validation and a verified curated fallback.'
  },
  {
    icon: IconTrendingUp,
    title: 'Skill mastery loop',
    copy:
      'Attempt, diagnose, explain, retry, and master. Remedial questions keep the expedition moving when a concept needs another pass.'
  },
  {
    icon: IconLayers,
    title: 'Visible progress',
    copy:
      'Earn XP instantly, track solved checkpoints, and watch your progression through the live HUD and achievement registry.'
  }
];

const STEPS = [
  {
    number: '01',
    title: 'Choose your topic',
    copy: 'Open the expedition dashboard and select a learning track and difficulty.'
  },
  {
    number: '02',
    title: 'Enter the world',
    copy: 'Navigate a procedural 3D island with physics-driven platforming and checkpoint beacons.'
  },
  {
    number: '03',
    title: 'Clear the checkpoint',
    copy: 'Answer AI-generated questions to unlock the next section and keep moving forward.'
  },
  {
    number: '04',
    title: 'Claim your progress',
    copy: 'Bank XP, receive reward entitlements, and record verifiable credentials on-chain.'
  }
];

const CHAIN_FEATURES = [
  {
    icon: IconCoins,
    title: 'LQST utility token',
    copy:
      'A capped-supply ERC-20 token on MST Testnet. Minting is restricted to the rewards contract, and store purchases settle on-chain.'
  },
  {
    icon: IconShieldCheck,
    title: 'EIP-712 reward vouchers',
    copy:
      'Server-signed typed-data vouchers authorize rewards without exposing the operator key to the browser.'
  },
  {
    icon: IconAward,
    title: 'Soulbound achievements',
    copy:
      'Level mastery is written to an on-chain achievements registry tied to the player wallet.'
  },
  {
    icon: IconCpu,
    title: 'In-game store',
    copy:
      'Spend LQST on hint packs and cosmetics through the deployed MST store contract.'
  }
];

export function LandingScreen({ onStart, onOpenAuth, onOpenTOS, onOpenPrivacy, onExplore }) {
  const mst = MST_NETWORKS.TESTNET;
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollToLearning = () => {
    if (onExplore) {
      onExplore();
      return;
    }
    document.getElementById('experience')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="w-full bg-cinematic-bg text-cinematic-text">
      <CinematicHero
        onStart={onStart}
        onExplore={scrollToLearning}
        onOpenAuth={onOpenAuth}
      />

      {/* Technical strip -------------------------------------------------- */}
      <div className="border-y border-cinematic-accent/20 bg-cinematic-deep/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-cinematic-accent/15 font-mono text-[9px] uppercase tracking-[0.22em] text-cinematic-muted sm:grid-cols-4">
          {[
            'AI curriculum // Gemini',
            '3D world // React Three Fiber',
            'Settlement // EIP-712',
            `Network // ${mst.name}`
          ].map((item) => (
            <div key={item} className="px-4 py-3 sm:px-6">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Learning experience --------------------------------------------- */}
      <section
        id="experience"
        className="scroll-mt-20 border-b border-cinematic-accent/15 px-4 py-20 sm:px-6 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionLabel index="01">The learning experience</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <h2 className="font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.02em] text-cinematic-text sm:text-5xl lg:text-6xl">
                Not a course.
                <br />
                <span className="text-cinematic-signal">An expedition.</span>
              </h2>
              <p className="max-w-md font-body text-sm leading-relaxed text-cinematic-muted sm:text-base lg:justify-self-end">
                LearnQuest turns computer science and blockchain fundamentals into a
                playable 3D world. Knowledge opens doors, checkpoints test what you
                understand, and every completed challenge moves your expedition
                forward.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-px bg-cinematic-accent/20 sm:grid-cols-2">
            {EXPERIENCE_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <Reveal key={card.title} delay={index * 70}>
                  <article className="group h-full bg-cinematic-bg p-6 transition-colors hover:bg-cinematic-deep/50 sm:p-8">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center border border-cinematic-accent/40 text-cinematic-signal">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-cinematic-accent/60">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-cinematic-text">
                      {card.title}
                    </h3>
                    <p className="mt-3 font-body text-sm leading-relaxed text-cinematic-muted">
                      {card.copy}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works ---------------------------------------------------- */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-b border-cinematic-accent/15 bg-cinematic-deep/15 px-4 py-20 sm:px-6 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionLabel index="02">How it works</SectionLabel>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-2xl font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.02em] text-cinematic-text sm:text-5xl">
                Four steps from
                <br />
                <span className="text-cinematic-signal">curiosity to mastery.</span>
              </h2>
              <p className="max-w-sm font-body text-sm leading-relaxed text-cinematic-muted">
                Each expedition is a complete loop: choose a subject, enter the world,
                prove your understanding, and carry the result with you.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 80}>
                <div className="relative h-full border-t border-cinematic-accent/40 pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cinematic-signal">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold uppercase tracking-[0.04em] text-cinematic-text">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed text-cinematic-muted">
                    {step.copy}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-14 flex flex-col items-start justify-between gap-5 border border-cinematic-accent/30 bg-cinematic-bg px-6 py-7 sm:flex-row sm:items-center sm:px-8">
              <p className="max-w-xl font-body text-sm leading-relaxed text-cinematic-muted">
                Your first expedition starts with a single checkpoint. Sign in to save
                progress, or jump straight in and let the HUD guide you.
              </p>
              <button
                type="button"
                onClick={onStart}
                className="inline-flex shrink-0 items-center gap-3 bg-cinematic-signal px-7 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cinematic-bg transition-colors hover:bg-cinematic-soft"
              >
                <IconPlay className="h-3.5 w-3.5" />
                Start Expedition
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Blockchain ------------------------------------------------------ */}
      <section
        id="blockchain"
        className="scroll-mt-20 border-b border-cinematic-accent/15 px-4 py-20 sm:px-6 lg:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionLabel index="03">Blockchain integration</SectionLabel>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.02em] text-cinematic-text sm:text-5xl">
                  Progress you can
                  <br />
                  <span className="text-cinematic-signal">verify on-chain.</span>
                </h2>
                <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-cinematic-muted">
                  LearnQuest separates durable gameplay XP from the on-chain utility
                  token economy. Mastery earns entitlements, and only signed claims
                  settle on MST Testnet.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-px bg-cinematic-accent/20">
                  {[
                    ['Network', mst.name],
                    ['Chain ID', String(mst.chainId)],
                    ['Currency', mst.currencySymbol],
                    ['Token', 'LQST'],
                    ['Max supply', '100M'],
                    ['Reward rate', `${Math.round(1 / XP_ECONOMY.XP_TO_TOKEN_RATIO)} XP = 1 LQST`]
                  ].map(([label, value]) => (
                    <div key={label} className="bg-cinematic-bg px-4 py-3">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-cinematic-accent/70">
                        {label}
                      </div>
                      <div className="mt-1 font-mono text-xs text-cinematic-text">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={mst.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cinematic-soft transition-colors hover:text-cinematic-signal"
                >
                  Open MST explorer
                  <IconExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid gap-px bg-cinematic-accent/20 sm:grid-cols-2">
                {CHAIN_FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Reveal key={feature.title} delay={index * 70}>
                      <article className="h-full bg-cinematic-bg p-6 transition-colors hover:bg-cinematic-deep/50">
                        <Icon className="h-5 w-5 text-cinematic-signal" />
                        <h3 className="mt-4 font-display text-sm font-bold uppercase tracking-[0.04em] text-cinematic-text">
                          {feature.title}
                        </h3>
                        <p className="mt-2 font-body text-xs leading-relaxed text-cinematic-muted">
                          {feature.copy}
                        </p>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA ------------------------------------------------------- */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32">
        <div className="cinematic-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cinematic-signal">
              Expedition 001 // Ready
            </p>
            <h2 className="mt-5 font-display text-3xl font-black uppercase leading-[1.02] tracking-[0.02em] text-cinematic-text sm:text-5xl lg:text-6xl">
              Your next level
              <br />
              starts here.
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-sm leading-relaxed text-cinematic-muted sm:text-base">
              Step through the wall. Choose a topic, clear your first checkpoint, and
              turn what you learn into progress you can keep.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex w-full items-center justify-center gap-3 bg-cinematic-signal px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cinematic-bg transition-colors hover:bg-cinematic-soft sm:w-auto"
              >
                <IconPlay className="h-4 w-4" />
                Start Expedition
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex w-full items-center justify-center gap-2 border border-cinematic-accent/40 px-8 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cinematic-soft transition-colors hover:border-cinematic-signal hover:text-cinematic-signal sm:w-auto"
              >
                Create Profile / Sign In
                <IconArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer ---------------------------------------------------------- */}
      <footer className="border-t border-cinematic-accent/20 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center bg-cinematic-accent font-mono text-[10px] font-bold text-cinematic-bg">
              LQ
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cinematic-muted">
              LearnQuest // Built on {mst.name}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[9px] uppercase tracking-[0.18em] text-cinematic-muted">
            <button
              type="button"
              onClick={onOpenTOS}
              className="transition-colors hover:text-cinematic-text"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="transition-colors hover:text-cinematic-text"
            >
              Privacy Policy
            </button>
            <span className="text-cinematic-accent/50">LearnQuest 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
