/**
 * ThemeDesignWizard — three-stage cascading picker:
 *   Stage 1: 10 themes
 *   Stage 2: 6 events (Engagement, Haldi, Mehandi, Marriage, Reception, Sangeeth)
 *   Stage 3: 3 designs for the picked (theme, event)
 *
 * At every stage the user can:
 *   • Preview a design (opens a full-screen modal showing the actual
 *     invitation page with the couple photo, animations, music, scroll).
 *   • Pick a design (commits theme + event + design to the form).
 *
 * Credit cost & "all-pack" cost are surfaced in the header so the
 * photographer knows what they will spend BEFORE they commit.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Eye, Sparkles, Coins } from 'lucide-react';
import { getAllThemes, getThemeById } from '@/themes/masterThemes';
import { useThemeDesigns, EVENTS } from '@/themes/allDesigns';
import { useAllDesigns } from '@/themes/allDesigns';
import ThemeDesignPreviewModal from './ThemeDesignPreviewModal';

const EVENT_LABELS = {
  Engagement: 'Engagement',
  Haldi: 'Haldi',
  Mehandi: 'Mehandi',
  Marriage: 'Marriage / Wedding',
  Reception: 'Reception',
  Sangeeth: 'Sangeet',
};

const ThemeDesignWizard = ({ value, onChange, coupleData = {}, creditPricing = {} }) => {
  // value: { theme_id, event, design_id }
  const [stage, setStage] = useState(value?.theme_id ? (value?.event ? 'design' : 'event') : 'theme');
  const [pickedTheme, setPickedTheme] = useState(value?.theme_id || null);
  const [pickedEvent, setPickedEvent] = useState(value?.event || null);
  const [previewDesign, setPreviewDesign] = useState(null);

  // Preload all themes for snappier switching
  useAllDesigns();
  const themeDesigns = useThemeDesigns(pickedTheme);

  const themes = getAllThemes();
  const themeObj = pickedTheme ? getThemeById(pickedTheme) : null;
  const designs = (pickedTheme && pickedEvent && themeDesigns?.events?.[pickedEvent]) || [];

  // Credit calc
  const themeCost = themeObj?.creditCost || 0;
  const allPackCost = creditPricing.all_pack ?? (themeCost * 6); // default: 6 events
  const designCost = creditPricing.design ?? Math.max(1, Math.ceil(themeCost / 2));

  const pickTheme = (t) => {
    setPickedTheme(t.id);
    setPickedEvent(null);
    setStage('event');
    onChange?.({ ...value, theme_id: t.id, event: null, design_id: null });
  };
  const pickEvent = (ev) => {
    setPickedEvent(ev);
    setStage('design');
    onChange?.({ ...value, theme_id: pickedTheme, event: ev, design_id: null });
  };
  const pickDesign = (d) => {
    onChange?.({
      ...value,
      theme_id: pickedTheme,
      event: pickedEvent,
      design_id: d.id,
      event_type: pickedEvent, // alias for backend
    });
  };

  const back = () => {
    if (stage === 'design') {
      setStage('event');
      setPickedEvent(null);
    } else if (stage === 'event') {
      setStage('theme');
      setPickedTheme(null);
    }
  };

  return (
    <div data-testid="theme-design-wizard" data-stage={stage}>
      {/* Credit summary header */}
      <div className="lux-glass p-4 mb-5 flex flex-wrap items-center justify-between gap-3"
           data-testid="theme-wizard-credit-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grid place-items-center shrink-0"
               style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)' }}>
            <Coins className="w-4 h-4" style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div className="lux-eyebrow text-[9px] mb-0.5">◆ Credits</div>
            <div className="text-sm" style={{ color: '#FFF8DC' }}>
              {pickedTheme ? (
                <>
                  <span className="text-gold font-display">All-pack: {allPackCost} credits</span>
                  <span className="mx-2 opacity-50">·</span>
                  <span>This design: <span className="text-gold font-display">{designCost} credits</span></span>
                </>
              ) : (
                <span>Pick a theme to see exact credit costs.</span>
              )}
            </div>
          </div>
        </div>
        {stage !== 'theme' && (
          <button type="button" onClick={back}
            className="lux-btn lux-btn-ghost text-xs inline-flex items-center gap-1.5"
            data-testid="theme-wizard-back">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-[11px] tracking-[0.25em] uppercase"
           style={{ color: 'rgba(255,248,220,0.55)' }}
           data-testid="theme-wizard-breadcrumb">
        <span style={{ color: stage === 'theme' ? '#D4AF37' : 'inherit' }}>1. Theme</span>
        <span>›</span>
        <span style={{ color: stage === 'event' ? '#D4AF37' : 'inherit', opacity: pickedTheme ? 1 : 0.4 }}>
          2. Event
        </span>
        <span>›</span>
        <span style={{ color: stage === 'design' ? '#D4AF37' : 'inherit', opacity: pickedEvent ? 1 : 0.4 }}>
          3. Design
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Stage 1: pick theme */}
        {stage === 'theme' && (
          <motion.div key="stage-theme"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="wizard-theme-grid">
            {themes.map((t) => {
              const selected = pickedTheme === t.id;
              return (
                <div key={t.id} className="lux-glass p-5 transition-all cursor-pointer"
                  onClick={() => pickTheme(t)}
                  style={selected ? { borderColor: 'var(--lux-gold)', background: 'rgba(212,175,55,0.07)' } : {}}
                  data-testid={`wizard-theme-${t.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.5)' }}>
                      {String(t.order).padStart(2, '0')}
                    </span>
                    <div className="flex -space-x-1.5">
                      {t.paletteSwatch.map((c, idx) => (
                        <span key={idx} className="w-4 h-4 rounded-full border"
                          style={{ background: c, borderColor: 'rgba(255,248,220,0.2)' }} />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-display text-xl mb-1" style={{ color: '#FFF8DC' }}>{t.name}</h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,248,220,0.55)' }}>{t.culture}</p>
                  <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase mb-2"
                    style={{ color: 'rgba(255,248,220,0.55)' }}>
                    <span>All-pack</span>
                    <span className="text-gold">{(t.creditCost || 1) * 6} credits</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: 'rgba(255,248,220,0.55)' }}>
                    <span>Per design</span>
                    <span className="text-gold">{Math.max(1, Math.ceil((t.creditCost || 1) / 2))} credits</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Stage 2: pick event */}
        {stage === 'event' && themeObj && (
          <motion.div key="stage-event"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            data-testid="wizard-event-grid">
            <div className="mb-4">
              <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>
                {themeObj.name} <span className="text-gold italic font-script">events</span>
              </h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,248,220,0.6)' }}>
                Choose which ceremony you're designing for. We'll auto-fill it as your primary ceremony.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EVENTS.map((ev) => (
                <button key={ev} type="button"
                  onClick={() => pickEvent(ev)}
                  className="lux-glass p-6 text-left transition-all hover:scale-[1.02]"
                  data-testid={`wizard-event-${ev}`}>
                  <div className="lux-eyebrow text-[9px] mb-2">◆ Ceremony</div>
                  <h4 className="font-display text-xl mb-1" style={{ color: '#FFF8DC' }}>
                    {EVENT_LABELS[ev] || ev}
                  </h4>
                  <p className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                    3 designs available in {themeObj.name}.
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stage 3: pick design */}
        {stage === 'design' && themeObj && pickedEvent && (
          <motion.div key="stage-design"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            data-testid="wizard-design-grid">
            <div className="mb-4">
              <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>
                {themeObj.name} · <span className="text-gold">{EVENT_LABELS[pickedEvent] || pickedEvent}</span>
              </h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,248,220,0.6)' }}>
                Click <strong>Preview</strong> to see the full invitation in action (with photos, music, animations).
              </p>
            </div>
            {!themeDesigns && (
              <div className="lux-glass p-10 text-center" style={{ color: 'rgba(255,248,220,0.6)' }}>
                Loading designs…
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {designs.map((d, i) => {
                const selected = value?.design_id === d.id;
                return (
                  <div key={d.id}
                    className="lux-glass p-3 transition-all overflow-hidden"
                    style={selected
                      ? { borderColor: 'var(--lux-gold)', background: 'rgba(212,175,55,0.07)' }
                      : {}}
                    data-testid={`wizard-design-${d.id}`}>
                    <div className="relative w-full overflow-hidden rounded-md mb-3"
                         style={{ aspectRatio: '3/4', background: d.bg || themeDesigns?.tokens?.background || '#FDF2D6' }}>
                      {d.image && (
                        <img src={d.image} alt={d.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          style={{ opacity: 0.92 }} />
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end p-3"
                           style={{
                             background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)',
                             color: '#FFF8DC',
                           }}>
                        <div className="font-display text-sm">{d.headline || d.title}</div>
                      </div>
                    </div>
                    <h4 className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: '#FFF8DC' }}>
                      Design {i + 1}
                    </h4>
                    <p className="text-[11px] mb-3" style={{ color: 'rgba(255,248,220,0.55)' }}>
                      {d.title}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPreviewDesign(d)}
                        className="lux-btn lux-btn-ghost text-[10px] flex-1 justify-center"
                        data-testid={`wizard-design-preview-${d.id}`}>
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button type="button" onClick={() => pickDesign(d)}
                        className="lux-btn text-[10px] flex-1 justify-center"
                        style={selected ? { background: '#D4AF37', color: '#16110C' } : {}}
                        data-testid={`wizard-design-pick-${d.id}`}>
                        {selected ? <><Check className="w-3 h-3" /> Picked</> : 'Use this'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ThemeDesignPreviewModal
        open={!!previewDesign}
        design={previewDesign}
        theme={themeObj}
        themeDesigns={themeDesigns}
        event={pickedEvent}
        couple={coupleData}
        onClose={() => setPreviewDesign(null)}
        onUse={(d) => { pickDesign(d); setPreviewDesign(null); }}
      />
    </div>
  );
};

export default ThemeDesignWizard;
