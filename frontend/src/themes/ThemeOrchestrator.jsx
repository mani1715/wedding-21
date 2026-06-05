/**
 * ThemeOrchestrator — Decides which opening to render for the active theme + event type.
 *
 * Responsibilities:
 *  • Detect GPU tier (using `detect-gpu`)
 *  • Detect `prefers-reduced-motion`
 *  • Lazy-load the correct opening chunk based on theme AND event type
 *  • Pass the right particle count for the device tier
 *  • Call `onComplete` when the opening finishes
 *
 * Event-specific animations per theme:
 *  • Marriage: Grand, ceremonial animations
 *  • Engagement: Romantic, intimate animations
 *  • Reception: Celebratory, festive animations
 *  • Haldi/Sangeet/Mehendi: Colorful, vibrant animations (shared file per theme)
 *
 * Only the active theme + event combination downloads — other variants never load.
 */
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { isMobile, isLowEnd } from './shared/deviceCaps';

/* ── Lazy-loaded per-theme EVENT-SPECIFIC openings ─────────────────────────────────── */
// Temple
const TEMPLE_MARRIAGE   = lazy(() => import('./temple/TempleMarriageOpening'));
const TEMPLE_ENGAGEMENT = lazy(() => import('./temple/TempleEngagementOpening'));
const TEMPLE_RECEPTION  = lazy(() => import('./temple/TempleReceptionOpening'));
const TEMPLE_HALDI      = lazy(() => import('./temple/TempleHaldiOpening'));
const TEMPLE_FALLBACK   = lazy(() => import('./temple/TempleCSSFallback'));

// Mughal
const MUGHAL_MARRIAGE   = lazy(() => import('./mughal/MughalMarriageOpening'));
const MUGHAL_ENGAGEMENT = lazy(() => import('./mughal/MughalEngagementOpening'));
const MUGHAL_RECEPTION  = lazy(() => import('./mughal/MughalReceptionOpening'));
const MUGHAL_HALDI      = lazy(() => import('./mughal/MughalHaldiOpening'));
const MUGHAL_FALLBACK   = lazy(() => import('./mughal/MughalCSSFallback'));

// Muslim
const MUSLIM_MARRIAGE   = lazy(() => import('./muslim/MuslimMarriageOpening'));
const MUSLIM_ENGAGEMENT = lazy(() => import('./muslim/MuslimEngagementOpening'));
const MUSLIM_RECEPTION  = lazy(() => import('./muslim/MuslimReceptionOpening'));
const MUSLIM_HALDI      = lazy(() => import('./muslim/MuslimHaldiOpening'));
const MUSLIM_FALLBACK   = lazy(() => import('./muslim/MuslimCSSFallback'));

// Christian
const CHRISTIAN_MARRIAGE   = lazy(() => import('./christian/ChristianMarriageOpening'));
const CHRISTIAN_ENGAGEMENT = lazy(() => import('./christian/ChristianEngagementOpening'));
const CHRISTIAN_RECEPTION  = lazy(() => import('./christian/ChristianReceptionOpening'));
const CHRISTIAN_HALDI      = lazy(() => import('./christian/ChristianHaldiOpening'));
const CHRISTIAN_FALLBACK   = lazy(() => import('./christian/ChristianCSSFallback'));

// Punjabi
const PUNJABI_MARRIAGE   = lazy(() => import('./punjabi/PunjabiMarriageOpening'));
const PUNJABI_ENGAGEMENT = lazy(() => import('./punjabi/PunjabiEngagementOpening'));
const PUNJABI_RECEPTION  = lazy(() => import('./punjabi/PunjabiReceptionOpening'));
const PUNJABI_HALDI      = lazy(() => import('./punjabi/PunjabiHaldiOpening'));
const PUNJABI_FALLBACK   = lazy(() => import('./punjabi/PunjabiCSSFallback'));

// Bengali
const BENGALI_MARRIAGE   = lazy(() => import('./bengali/BengaliMarriageOpening'));
const BENGALI_ENGAGEMENT = lazy(() => import('./bengali/BengaliEngagementOpening'));
const BENGALI_RECEPTION  = lazy(() => import('./bengali/BengaliReceptionOpening'));
const BENGALI_HALDI      = lazy(() => import('./bengali/BengaliHaldiOpening'));
const BENGALI_FALLBACK   = lazy(() => import('./bengali/BengaliCSSFallback'));

// Beach
const BEACH_MARRIAGE   = lazy(() => import('./beach/BeachMarriageOpening'));
const BEACH_ENGAGEMENT = lazy(() => import('./beach/BeachEngagementOpening'));
const BEACH_RECEPTION  = lazy(() => import('./beach/BeachReceptionOpening'));
const BEACH_HALDI      = lazy(() => import('./beach/BeachHaldiOpening'));
const BEACH_FALLBACK   = lazy(() => import('./beach/BeachCSSFallback'));

// Nature
const NATURE_MARRIAGE   = lazy(() => import('./nature/NatureMarriageOpening'));
const NATURE_ENGAGEMENT = lazy(() => import('./nature/NatureEngagementOpening'));
const NATURE_RECEPTION  = lazy(() => import('./nature/NatureReceptionOpening'));
const NATURE_HALDI      = lazy(() => import('./nature/NatureHaldiOpening'));
const NATURE_FALLBACK   = lazy(() => import('./nature/NatureCSSFallback'));

// Minimal
const MINIMAL_MARRIAGE   = lazy(() => import('./minimal/MinimalMarriageOpening'));
const MINIMAL_ENGAGEMENT = lazy(() => import('./minimal/MinimalEngagementOpening'));
const MINIMAL_RECEPTION  = lazy(() => import('./minimal/MinimalReceptionOpening'));
const MINIMAL_HALDI      = lazy(() => import('./minimal/MinimalHaldiOpening'));
const MINIMAL_FALLBACK   = lazy(() => import('./minimal/MinimalCSSFallback'));

// Kerala
const KERALA_MARRIAGE   = lazy(() => import('./kerala_backwaters/KeralaMarriageOpening'));
const KERALA_ENGAGEMENT = lazy(() => import('./kerala_backwaters/KeralaEngagementOpening'));
const KERALA_RECEPTION  = lazy(() => import('./kerala_backwaters/KeralaReceptionOpening'));
const KERALA_HALDI      = lazy(() => import('./kerala_backwaters/KeralaHaldiOpening'));
const KERALA_FALLBACK   = lazy(() => import('./kerala_backwaters/KeralaCSSFallback'));

/* ── Per-theme registry ────────────────────────────────────────────────────────────── */
const THEME_REGISTRY = {
  south_indian_temple: {
    bg: '#0A0806', accent: '#FFD700', fallback: TEMPLE_FALLBACK,
    events: { marriage: TEMPLE_MARRIAGE, engagement: TEMPLE_ENGAGEMENT, reception: TEMPLE_RECEPTION, haldi: TEMPLE_HALDI },
  },
  royal_mughal: {
    bg: '#0D0806', accent: '#E8C97A', fallback: MUGHAL_FALLBACK,
    events: { marriage: MUGHAL_MARRIAGE, engagement: MUGHAL_ENGAGEMENT, reception: MUGHAL_RECEPTION, haldi: MUGHAL_HALDI },
  },
  muslim_nikah: {
    bg: '#060810', accent: '#C5A028', fallback: MUSLIM_FALLBACK,
    events: { marriage: MUSLIM_MARRIAGE, engagement: MUSLIM_ENGAGEMENT, reception: MUSLIM_RECEPTION, haldi: MUSLIM_HALDI },
  },
  christian_elegant: {
    bg: '#08080F', accent: '#FFD700', fallback: CHRISTIAN_FALLBACK,
    events: { marriage: CHRISTIAN_MARRIAGE, engagement: CHRISTIAN_ENGAGEMENT, reception: CHRISTIAN_RECEPTION, haldi: CHRISTIAN_HALDI },
  },
  punjabi_sangeet: {
    bg: '#1A0A00', accent: '#FFD700', fallback: PUNJABI_FALLBACK,
    events: { marriage: PUNJABI_MARRIAGE, engagement: PUNJABI_ENGAGEMENT, reception: PUNJABI_RECEPTION, haldi: PUNJABI_HALDI },
  },
  bengali_traditional: {
    bg: '#0D0505', accent: '#FFD700', fallback: BENGALI_FALLBACK,
    events: { marriage: BENGALI_MARRIAGE, engagement: BENGALI_ENGAGEMENT, reception: BENGALI_RECEPTION, haldi: BENGALI_HALDI },
  },
  beach_destination: {
    bg: '#030D1A', accent: '#E9C46A', fallback: BEACH_FALLBACK,
    events: { marriage: BEACH_MARRIAGE, engagement: BEACH_ENGAGEMENT, reception: BEACH_RECEPTION, haldi: BEACH_HALDI },
  },
  nature_eco_wedding: {
    bg: '#030A03', accent: '#CDDC39', fallback: NATURE_FALLBACK,
    events: { marriage: NATURE_MARRIAGE, engagement: NATURE_ENGAGEMENT, reception: NATURE_RECEPTION, haldi: NATURE_HALDI },
  },
  modern_minimal: {
    bg: '#0F0F0F', accent: '#C0C0C0', fallback: MINIMAL_FALLBACK,
    events: { marriage: MINIMAL_MARRIAGE, engagement: MINIMAL_ENGAGEMENT, reception: MINIMAL_RECEPTION, haldi: MINIMAL_HALDI },
  },
  kerala_backwaters: {
    bg: '#0B3D45', accent: '#D4A24C', fallback: KERALA_FALLBACK,
    events: { marriage: KERALA_MARRIAGE, engagement: KERALA_ENGAGEMENT, reception: KERALA_RECEPTION, haldi: KERALA_HALDI },
  },
  // Bollywood reuses Mughal for now (regal palette) — no dedicated assets yet
  bollywood_luxury: {
    bg: '#0D0806', accent: '#E8C97A', fallback: MUGHAL_FALLBACK,
    events: { marriage: MUGHAL_MARRIAGE, engagement: MUGHAL_ENGAGEMENT, reception: MUGHAL_RECEPTION, haldi: MUGHAL_HALDI },
  },
};

const eventKey = (eventType) => {
  const e = (eventType || 'marriage').toLowerCase();
  if (e === 'engagement') return 'engagement';
  if (e === 'reception') return 'reception';
  if (['haldi', 'sangeet', 'mehendi'].includes(e)) return 'haldi';
  return 'marriage';
};

const getEventAnimation = (themeId, eventType) => {
  const theme = THEME_REGISTRY[themeId] || THEME_REGISTRY.royal_mughal;
  const key = eventKey(eventType);
  return {
    ThreeD: theme.events[key] || theme.events.marriage,
    Fallback: theme.fallback,
    bg: theme.bg,
    accent: theme.accent,
  };
};

/* ── GPU detection (one-shot, cached) ──────────────────────────────────────────────── */
let cachedTier = null;
const detectTier = async () => {
  if (cachedTier !== null) return cachedTier;
  try {
    const { getGPUTier } = await import('detect-gpu');
    const res = await getGPUTier();
    cachedTier = typeof res.tier === 'number' ? res.tier : 2;
  } catch (_) {
    cachedTier = 1;
  }
  return cachedTier;
};

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ThemeLoadingFallback = ({ bg = '#0D0806', accent = '#E8C97A' }) => (
  <div
    className="fixed inset-0 z-[80] grid place-items-center"
    style={{ background: bg, color: accent }}
    data-testid="theme-loading-fallback"
  >
    <div className="text-xs tracking-[0.4em] uppercase opacity-70">Preparing…</div>
  </div>
);

const ThemeOrchestrator = ({
  themeId = 'royal_mughal',
  eventType = 'marriage',
  brideName,
  groomName,
  monogram,
  subtitle,
  onComplete,
}) => {
  const [tier, setTier] = useState(null);
  // 2026-05 perf overhaul: hold the heavy Three.js scene mount until the
  // browser is idle so it doesn't compete with the first paint of the
  // page underneath.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    detectTier().then(setTier);
    let id;
    if (typeof requestIdleCallback !== 'undefined') {
      id = requestIdleCallback(() => setIdle(true), { timeout: 800 });
    } else {
      id = setTimeout(() => setIdle(true), 350);
    }
    return () => {
      if (typeof cancelIdleCallback !== 'undefined' && typeof id === 'number') {
        try { cancelIdleCallback(id); } catch (_) {}
      } else {
        clearTimeout(id);
      }
    };
  }, []);

  const entry = getEventAnimation(themeId, eventType);

  if (tier === null || !idle) {
    return <ThemeLoadingFallback bg={entry?.bg} accent={entry?.accent} />;
  }

  if (!entry) {
    onComplete?.();
    return null;
  }

  const reduced = reducedMotion();
  const { ThreeD, Fallback, bg, accent } = entry;
  const Loading = <ThemeLoadingFallback bg={bg} accent={accent} />;

  // Low-tier or reduced-motion → CSS fallback
  if (reduced || tier === 0) {
    return (
      <Suspense fallback={Loading}>
        <Fallback
          brideName={brideName}
          groomName={groomName}
          subtitle={subtitle}
          onComplete={onComplete}
        />
      </Suspense>
    );
  }

  // Haldi-style events use more particles for vibrant burst effect.
  // 2026-05 perf overhaul — all defaults halved:
  // 320 → 160 (Haldi family), 220 → 110 (rest).
  const isHaldiFamily = ['haldi', 'sangeet', 'mehendi'].includes((eventType || '').toLowerCase());
  const baseCount = isHaldiFamily ? 160 : 110;
  // Mobile-aware scaling: tier-1 GPU = 50%; mobile = 60%; low-end = 40%
  let particleCount = baseCount;
  if (tier === 1) particleCount = Math.floor(baseCount * 0.5);
  if (isLowEnd()) particleCount = Math.floor(baseCount * 0.4);
  else if (isMobile()) particleCount = Math.floor(baseCount * 0.6);

  return (
    <Suspense fallback={Loading}>
      <ThreeD
        brideName={brideName}
        groomName={groomName}
        monogram={monogram}
        subtitle={subtitle}
        particleCount={particleCount}
        onComplete={onComplete}
      />
    </Suspense>
  );
};

export default ThemeOrchestrator;
