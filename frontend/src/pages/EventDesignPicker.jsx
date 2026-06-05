/**
 * EventDesignPicker — Step C of the design picker flow.
 *
 * Route: /themes/:themeId/events/:event
 *
 * Shows the 3 photo-design variants for the chosen (theme, event)
 * pair rendered via `UniversalDesignRenderer` (image + theme wash +
 * animated overlays + text). Clicking → /themes/:themeId/events/:event/design/:idx.
 */
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import UniversalDesignRenderer from '@/themes/UniversalDesignRenderer';
import { ALL_DESIGNS, useThemeDesigns } from '@/themes/allDesigns';
import { KERALA_COLORS } from '@/themes/kerala_backwaters/kerala.colors';
import { getThemeById } from '@/themes/masterThemes';
import { normaliseEvent, resolveDesign } from '@/themes/themeDesignResolver';
import { getThemeSampleData } from '@/themes/sampleData';
import { AnimationProvider } from '@/components/animations';
import ThemeAnimatedBackground from '@/components/ThemeAnimatedBackground';

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: 'blur(10px)' },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&q=85';

const EventDesignPicker = () => {
  const { themeId, event: rawEvent } = useParams();
  const navigate = useNavigate();
  const themeMeta = useMemo(() => getThemeById(themeId), [themeId]);
  const event = useMemo(() => normaliseEvent(rawEvent), [rawEvent]);
  // PHASE 8: lazy-load the selected theme's design config.
  const themeDesigns = useThemeDesigns(themeId);

  // Theme-specific dummy couple/date so each theme's preview shows
  // culturally resonant placeholders.
  const SAMPLE = useMemo(() => {
    const s = getThemeSampleData(themeId) || {};
    return {
      bride: s.bride || 'Anaya',
      groom: s.groom || 'Vihaan',
      date:  s.weddingDate || '14 Feb 2026',
      venue: s.venue || 'The Mandap',
      photo: SAMPLE_PHOTO,
    };
  }, [themeId]);

  const variants = useMemo(() => {
    return [0, 1, 2]
      .map((idx) => {
        const r = resolveDesign(themeId, event, idx);
        return r ? { ...r, index: idx } : null;
      })
      .filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, event, themeDesigns]);

  const tokens = variants[0]?.theme?.tokens || (themeId === 'kerala_backwaters'
    ? { background: KERALA_COLORS.water, text: KERALA_COLORS.text, accent: KERALA_COLORS.secondary }
    : (themeDesigns?.tokens || ALL_DESIGNS[themeId]?.tokens || { background: '#0a0a0a', text: '#F5ECD7', accent: '#D4AF37' }));

  useEffect(() => {
    const prevBody = document.body.style.background;
    // Keep WHITE background
    document.body.style.background = '#FFFFFF';
    document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
    return () => { document.body.style.background = prevBody; };
  }, [tokens.background]);

  if (!themeMeta || variants.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center px-6" style={{ background: '#0a0a0a', color: '#FFF8DC' }}>
        <div className="text-center">
          <h2 className="font-display text-3xl mb-3">No designs found for this event.</h2>
          <button onClick={() => navigate(`/themes/${themeId}/events`)} className="lux-btn lux-btn-ghost">
            Back to ceremonies
          </button>
        </div>
      </div>
    );
  }

  const accent = tokens.accentGold || tokens.accent;
  // CRITICAL FIX (Bucket 1 — invisible text): some themes ship pale `tokens.text`
  // (beach #FFF8F2, christian #F8F4EC, muslim #F5ECD7). The design-picker page
  // forces a white background, so we auto-darken those before they reach the
  // page chrome. Card previews keep their own colours.
  const isLightText = (hex) => {
    if (!hex || typeof hex !== 'string') return false;
    const h = hex.replace('#', '');
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7;
  };
  const text = isLightText(tokens.text) ? '#1a1410' : tokens.text;
  const headingFont = tokens.heading || '"Cormorant Garamond", serif';

  return (
    <AnimationProvider>
      {/* 3D Animated Background */}
      <ThemeAnimatedBackground theme={themeId} />
      
      <div className="relative min-h-screen" style={{ background: 'transparent', color: text }} data-testid={`design-picker-${themeId}-${event.toLowerCase()}`}>
        <div className="px-6 md:px-16 pt-12 pb-8 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(`/themes/${themeId}/events`)}
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase mb-8 opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: text }}
            data-testid="back-to-events"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ceremonies
          </button>

          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="block mb-4 text-[10px] tracking-[0.5em] uppercase" style={{ color: accent }}>
              ◈ Step 3 of 3 · {themeMeta.name} · {event}
            </span>
            <h1 className="leading-[1.02]" style={{ color: text, fontFamily: headingFont, fontSize: 'clamp(2.4rem, 6vw, 4.6rem)' }}>
              Three designs.{' '}
              <span style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>
                One love.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed opacity-80" style={{ color: text }}>
              Each design is a complete, animated scene — pick the one that feels like you. The
              names and dates below are samples; you'll edit them in the next step.
            </p>
          </motion.div>
        </div>

        <div className="px-6 md:px-16 pb-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {variants.map((v, i) => (
              <motion.div key={v.design.id} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} data-testid={`design-variant-${v.index}`}>
                <button
                  type="button"
                  onClick={() => navigate(`/themes/${themeId}/events/${event}/design/${v.index}`)}
                  className="w-full text-left transition-transform hover:-translate-y-1"
                  data-testid={`design-pick-${v.index}`}
                >
                  <UniversalDesignRenderer
                    design={v.design}
                    theme={v.theme}
                    bride={SAMPLE.bride}
                    groom={SAMPLE.groom}
                    date={SAMPLE.date}
                    venue={SAMPLE.venue}
                    photo={SAMPLE.photo}
                  />
                  <div className="mt-4 px-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>
                        Design {v.index + 1} of 3
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.3em] uppercase opacity-85" style={{ color: accent }}>
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </span>
                    </div>
                    <div className="text-[16px] leading-snug" style={{ color: text, fontFamily: headingFont }}>
                      {v.design.title}
                    </div>
                    <div className="text-[12px] mt-1 leading-relaxed opacity-75" style={{ color: text }}>
                      {v.design.description}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AnimationProvider>
  );
};

export default EventDesignPicker;
