/**
 * DesignFullPreview — Unified Stage layout.
 *
 * One single design-themed look for the ENTIRE page:
 *   • Page background = the design's natural parchment / cream / palette
 *     colour (from `design.bg`), PLUS a soft, low-opacity copy of the
 *     same design image fixed in the background — so the design extends
 *     everywhere (not just at the top).
 *   • Hero card: the design photo shown smaller (max-width 620 px),
 *     centered, sharp, with a soft drop-shadow. Empty space on the
 *     sides shares the same design-themed background, with subtle
 *     ornamental floating motifs.
 *   • All sub-sections (Our Story, Ceremonies, Names, Map, Comments,
 *     etc.) sit on top of the same background with a translucent
 *     parchment-tinted panel — so the design pattern is always visible.
 *
 * Structure (extensible):
 *   <PageStage>
 *     <SoftDesignBackdrop />          fixed, low-opacity design image
 *     <SideOrnaments />               subtle theme accent shapes
 *     <main>
 *       <HeroCard />                  the invitation
 *       <StorySection />
 *       <CeremoniesSection />
 *       <NamesSection (placeholder) />
 *       <MapSection (placeholder) />
 *       <CommentsSection (placeholder) />
 *       <VariantSwitcher />
 *     </main>
 *   </PageStage>
 *
 * Adding a new section later is just: drop a <Panel> child in <main>.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Edit3, Image as ImageIcon, Link as LinkIcon, MapPin, MessageSquare, Save, Share2, Upload, Users, X } from 'lucide-react';
import { ALL_DESIGNS, useThemeDesigns } from '@/themes/allDesigns';
import { KERALA_COLORS } from '@/themes/kerala_backwaters/kerala.colors';
import { getThemeById } from '@/themes/masterThemes';
import { normaliseEvent, resolveDesign, pageBgForDesign } from '@/themes/themeDesignResolver';
import { AnimationProvider } from '@/components/animations';
import UniversalDesignRenderer from '@/themes/UniversalDesignRenderer';
import { isLight as isLightColor } from '@/themes/textContrast';
import { getThemeSampleData } from '@/themes/sampleData';
import { OpeningOrchestrator, ClosingOrchestrator } from '@/themes/shared/ThemeAnimationOrchestrator';
import ThemeAnimatedBackground from '@/components/ThemeAnimatedBackground';
import DesignImage from '@/components/DesignImage';
import { Heart, Send, Sparkles, Gift, Plane, Hotel, Building2, Camera, Search } from 'lucide-react';

const LS_KEY = 'wedding3.designSelections.v1';
const readSelections = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; } };
const writeSelections = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } };

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&q=85';

// Build per-theme defaults from THEME_SAMPLE_DATA so each theme preview has
// its own culturally resonant placeholder couple (Lakshmi & Karthik for South
// Indian, Simran & Arjun for Punjabi, etc.).
const buildDefaultText = (themeId) => {
  const s = getThemeSampleData(themeId) || {};
  return {
    bride: s.bride || 'Anaya',
    groom: s.groom || 'Vihaan',
    date:  s.weddingDate || '14 February 2026',
    venue: `${s.venue || 'Falaknuma Palace'}${s.city ? ' · ' + s.city.split(',')[0] : ''}`,
    story: s.story || 'Two souls. One promise. A wedding to remember.',
    photo: DEFAULT_PHOTO,
  };
};

const DEFAULT_CEREMONIES = [
  { key: 'Engagement', date: '10 February 2026', venue: 'Garden Pavilion', time: '6:30 PM' },
  { key: 'Haldi',      date: '12 February 2026', venue: 'Family Courtyard', time: '10:00 AM' },
  { key: 'Mehandi',    date: '12 February 2026', venue: 'Rose Lawn',        time: '4:00 PM' },
  { key: 'Sangeeth',   date: '13 February 2026', venue: 'Crystal Ballroom', time: '8:00 PM' },
  { key: 'Marriage',   date: '14 February 2026', venue: 'The Mandap',       time: '11:00 AM' },
  { key: 'Reception',  date: '15 February 2026', venue: 'Falaknuma Palace', time: '7:00 PM' },
];

const DEFAULT_FAMILY = [
  { side: 'Bride', members: ['Rajesh & Meena Kapoor (Parents)', 'Aarav Kapoor (Brother)'] },
  { side: 'Groom', members: ['Suresh & Lata Mehta (Parents)', 'Riya Mehta (Sister)'] },
];

const DesignFullPreview = () => {
  const { themeId, event: rawEvent, designIndex } = useParams();
  const navigate = useNavigate();
  const themeMeta = useMemo(() => getThemeById(themeId), [themeId]);
  const event = useMemo(() => normaliseEvent(rawEvent), [rawEvent]);
  const idx = Math.max(0, Math.min(2, parseInt(designIndex || '0', 10)));
  // PHASE 8: lazy-load this specific theme's design config (also keeps cache hot).
  const themeDesigns = useThemeDesigns(themeId);

  const resolved = useMemo(() => resolveDesign(themeId, event, idx), [themeId, event, idx, themeDesigns]);
  const sampleData = useMemo(() => getThemeSampleData(themeId) || {}, [themeId]);
  const tokens = resolved?.theme?.tokens || (themeId === 'kerala_backwaters'
    ? { background: KERALA_COLORS.water, text: KERALA_COLORS.text, accent: KERALA_COLORS.secondary }
    : (themeDesigns?.tokens || ALL_DESIGNS[themeId]?.tokens || { background: '#0a0a0a', text: '#F5ECD7', accent: '#D4AF37' }));

  const [text, setText] = useState(() => {
    const stored = readSelections();
    return { ...buildDefaultText(themeId), ...(stored.text || {}) };
  });
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [coverText, setCoverText] = useState(() => {
    const stored = readSelections();
    return stored.coverText ?? false;
  });

  /* Per-theme cinematic opening — plays every time the user lands on a
     design preview (no sessionStorage gating).  The user complained that
     once-per-session caching meant the opening "didn't come" when they
     navigated between designs, so every entry replays the full cinematic. */
  const [openingDone, setOpeningDone] = useState(false);
  const markOpeningDone = useCallback(() => { setOpeningDone(true); }, []);
  // Replay the opening every time the user switches to a different design
  // (themeId / event / idx change) so each pick gets its own cinematic intro.
  useEffect(() => { setOpeningDone(false); }, [themeId, event, idx]);

  // SAFETY: never trap users on a blank screen if the opening orchestrator
  // chunk is slow or never reports completion.
  useEffect(() => {
    if (openingDone) return;
    const id = setTimeout(() => setOpeningDone(true), 6000);
    return () => clearTimeout(id);
  }, [openingDone, themeId, event, idx]);
  const footerRef = useRef(null);

  // Use design's own bg colour as the unified page colour
  const pageBg = pageBgForDesign(resolved?.design, { tokens });
  // Pick a readable text colour against the parchment background
  const textOnBg = isLightColor(pageBg) ? '#1A0F08' : '#FFF8DC';
  const mutedText = isLightColor(pageBg) ? 'rgba(40,26,16,0.78)' : 'rgba(255,248,220,0.85)';

  useEffect(() => {
    // Remove dark overlays and set LIGHT background
    document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
    document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)';
    return () => { document.body.style.background = ''; };
  }, [pageBg]);

  if (!themeMeta || !resolved) {
    return (
      <div className="min-h-screen grid place-items-center px-6" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', color: '#2F2F2F' }}>
        <div className="text-center">
          <h2 className="font-display text-3xl mb-3">Design not available.</h2>
          <button onClick={() => navigate(`/themes/${themeId}/events`)} className="lux-btn lux-btn-ghost">
            Back to ceremonies
          </button>
        </div>
      </div>
    );
  }

  const accent = tokens.accentGold || tokens.accent;
  const imgUrl = resolved.design.image;
  const headingFont = tokens.heading || '"Cormorant Garamond", serif';

  const handleSave = () => {
    const data = readSelections();
    data.text = text;
    data.coverText = coverText;
    data[`${themeId}__${event}`] = { themeId, event, designIndex: idx, designId: resolved.design.id };
    data.lastPick = { themeId, event, designIndex: idx, designId: resolved.design.id, savedAt: new Date().toISOString() };
    writeSelections(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${themeMeta.name} · ${event}`, url }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); setSaved(true); setTimeout(() => setSaved(false), 1800); } catch { /* ignore */ }
  };

  return (
    <AnimationProvider>
      {/* 3D Animated Background for Design Preview */}
      <ThemeAnimatedBackground theme={themeId} />
      
      {/* Per-theme cinematic opening — fires once per session per theme.
          Until the opening is done the rest of the page stays hidden. */}
      {!openingDone && (
        <OpeningOrchestrator
          themeId={themeId}
          event={event}
          image={resolved?.design?.image}
          bride={text.bride}
          groom={text.groom}
          date={text.date}
          monogram={`${(text.bride || '?')[0]} & ${(text.groom || '?')[0]}`}
          onComplete={markOpeningDone}
        />
      )}
      <div
        className="relative"
        style={{
          background: pageBg, color: textOnBg, minHeight: '100vh',
          opacity: openingDone ? 1 : 0,
          pointerEvents: openingDone ? 'auto' : 'none',
          transition: 'opacity 0.55s ease',
        }}
        data-testid={`design-full-preview-${themeId}-${event.toLowerCase()}-${idx}`}
      >
        {/* ── SOFT DESIGN-THEMED PAGE BACKDROP (fixed, low opacity) ─── */}
        <SoftDesignBackdrop image={imgUrl} accent={accent} pageBg={pageBg} />

        {/* ── Top controls ── */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-4"
          style={{
            background: `linear-gradient(180deg, ${pageBg}DD 0%, ${pageBg}00 100%)`,
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <button
            onClick={() => navigate(`/themes/${themeId}/events/${event}`)}
            className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase px-3 py-2 rounded-md"
            style={{ color: textOnBg, background: `${pageBg}CC`, border: `1px solid ${accent}55` }}
            data-testid="back-to-designs"
          >
            <ArrowLeft className="w-4 h-4" /> Designs
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditMode(v => !v)}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-md"
              style={{
                color: editMode ? pageBg : textOnBg,
                background: editMode ? accent : `${pageBg}CC`,
                border: `1px solid ${accent}77`,
              }}
              data-testid="toggle-edit-mode">
              <Edit3 className="w-3.5 h-3.5" /> {editMode ? 'Done editing' : 'Edit text'}
            </button>
            <button onClick={handleSave}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-md"
              style={{ color: pageBg, background: accent, border: `1px solid ${accent}` }}
              data-testid="save-selection">
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? 'Saved' : 'Save pick'}
            </button>
            <button onClick={handleShare}
              className="hidden sm:inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-md"
              style={{ color: textOnBg, background: `${pageBg}CC`, border: `1px solid ${accent}77` }}
              data-testid="share-design">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <main className="relative z-10" style={{ paddingTop: 70 }}>

          {/* HERO — invitation rendered through UniversalDesignRenderer
               so the photographer's clean text card always sits on top of
               (and covers) the poster's baked-in text. */}
          <Panel pageBg={pageBg} accent={accent} variant="hero">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.0, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto"
              style={{
                maxWidth: 'min(560px, 92vw)',
                width: '100%',
                willChange: 'transform',
                animation: 'card-float 6s ease-in-out infinite',
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.30)) drop-shadow(0 10px 24px rgba(0,0,0,0.18))',
              }}
              data-testid="card-text-overlay"
            >
              <UniversalDesignRenderer
                design={resolved.design}
                theme={resolved.theme}
                bride={text.bride}
                groom={text.groom}
                date={text.date}
                venue={text.venue}
                photo={text.photo}
                coverText={coverText}
                testId={`hero-${resolved.design.id}`}
              />
            </motion.div>

            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => setCoverText((v) => !v)}
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase px-3 py-2 rounded-md"
                style={{
                  color: coverText ? pageBg : textOnBg,
                  background: coverText ? accent : `${accent}22`,
                  border: `1px solid ${accent}66`,
                }}
                data-testid="toggle-cover-text"
                title="Hide any baked-in text on the template"
              >
                {coverText ? '✓ Clean canvas (hides design)' : 'Hide template baked-in text'}
              </button>
            </div>

            <div
              aria-hidden
              className="text-[10px] tracking-[0.5em] uppercase mt-6 text-center"
              style={{ color: accent, opacity: 0.85 }}
            >
              ▾ Scroll for details
            </div>
          </Panel>

          {/* OUR STORY */}
          <Panel pageBg={pageBg} accent={accent} testId="info-section">
            <Eyebrow accent={accent}>◆ Our Story</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Two souls. <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>One promise.</em>
            </SectionHeading>
            <p className="text-[1.05rem] leading-relaxed" style={{ color: mutedText }}>{text.story}</p>
          </Panel>

          {/* CEREMONIES */}
          <Panel pageBg={pageBg} accent={accent} testId="ceremonies-section">
            <Eyebrow accent={accent}>◆ Ceremonies</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Six days of <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>celebration.</em>
            </SectionHeading>
            <ul className="space-y-3 mt-5">
              {DEFAULT_CEREMONIES.map((c) => (
                <li key={c.key} className="flex flex-wrap items-baseline gap-3 md:gap-6 px-4 py-3 rounded-md"
                    style={{
                      background: c.key === event ? `${accent}22` : `${accent}10`,
                      border: `1px solid ${c.key === event ? accent + '88' : accent + '33'}`,
                    }}
                    data-testid={`ceremony-row-${c.key.toLowerCase()}`}>
                  <div className="text-[11px] tracking-[0.3em] uppercase w-24" style={{ color: accent }}>{c.key}</div>
                  <div className="flex-1 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: mutedText }}>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {c.date}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.venue}</span>
                    <span className="opacity-80">{c.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          {/* NAMES — Bride & Groom side family (placeholder, ready to wire) */}
          <Panel pageBg={pageBg} accent={accent} testId="names-section">
            <Eyebrow accent={accent}><Users className="w-3 h-3 inline-block mr-2 -mt-0.5" /> Family</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              With blessings <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>from both sides.</em>
            </SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {DEFAULT_FAMILY.map((f) => (
                <div key={f.side} className="px-5 py-4 rounded-md" style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}>
                  <div className="text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: accent }}>{f.side}'s side</div>
                  <ul className="space-y-1 text-sm" style={{ color: mutedText }}>
                    {f.members.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>

          {/* MAP — venue location (placeholder, ready to wire to Google Maps later) */}
          <Panel pageBg={pageBg} accent={accent} testId="map-section">
            <Eyebrow accent={accent}><MapPin className="w-3 h-3 inline-block mr-2 -mt-0.5" /> Venue</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Find <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>your way.</em>
            </SectionHeading>
            <div
              className="mt-5 rounded-md flex items-center justify-center text-sm"
              style={{
                background: `${accent}10`, border: `1px solid ${accent}33`,
                color: mutedText, minHeight: 220,
                backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.04) 75%, transparent 75%, transparent)',
                backgroundSize: '20px 20px',
              }}
            >
              <div className="text-center">
                <MapPin className="w-7 h-7 mx-auto mb-2" style={{ color: accent }} />
                <div className="font-display text-lg" style={{ fontFamily: headingFont, color: textOnBg }}>{text.venue}</div>
                <div className="text-[11px] tracking-[0.3em] uppercase mt-1" style={{ color: accent }}>Map coming soon</div>
              </div>
            </div>
          </Panel>

          {/* COMMENTS / WISHES — guest book placeholder */}
          {/* WISHES */}
          <Panel pageBg={pageBg} accent={accent} testId="comments-section">
            <Eyebrow accent={accent}><MessageSquare className="w-3 h-3 inline-block mr-2 -mt-0.5" /> Wishes</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Leave a <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>blessing.</em>
            </SectionHeading>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {(sampleData?.wishes || []).slice(0, 4).map((w, i) => (
                <div key={i} className="px-4 py-3 rounded-md"
                  style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}
                  data-testid={`dfp-wish-${i}`}>
                  <Heart className="w-3.5 h-3.5 mb-2" style={{ color: accent }} />
                  <p className="text-sm italic" style={{ color: textOnBg }}>"{w.text}"</p>
                  <div className="text-[10px] tracking-[0.25em] uppercase mt-2" style={{ color: mutedText }}>— {w.from}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-center">
              <button className="text-[11px] tracking-[0.25em] uppercase px-4 py-2 rounded-md"
                style={{ color: textOnBg, background: `${accent}15`, border: `1px solid ${accent}66` }}
                data-testid="dfp-wish-cta">
                <MessageSquare className="w-3.5 h-3.5 inline-block mr-2 -mt-0.5" />
                Send your wish
              </button>
            </div>
          </Panel>

          {/* RSVP */}
          <Panel pageBg={pageBg} accent={accent} testId="rsvp-section">
            <Eyebrow accent={accent}>◆ Will you be there?</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Kindly <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>respond.</em>
            </SectionHeading>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Your name" data-testid="dfp-rsvp-name"
                className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}55` }} />
              <input placeholder="Phone (+91)" data-testid="dfp-rsvp-phone"
                className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}55` }} />
              <select data-testid="dfp-rsvp-attending"
                className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}55` }}>
                <option>Yes, with joy</option>
                <option>Regretfully no</option>
                <option>Trying my best</option>
              </select>
              <input type="number" min={1} max={10} defaultValue={1} placeholder="Guests" data-testid="dfp-rsvp-guests"
                className="px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}55` }} />
            </div>
            <textarea rows={2} placeholder="A message for the couple (optional)"
              className="mt-3 w-full px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}55`, resize: 'vertical' }}
              data-testid="dfp-rsvp-message" />
            <div className="mt-4 text-right">
              <button className="text-[11px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-md inline-flex items-center gap-2"
                style={{ color: pageBg, background: accent }}
                data-testid="dfp-rsvp-submit">
                Send RSVP <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </Panel>

          {/* LIVE PHOTO WALL teaser */}
          <Panel pageBg={pageBg} accent={accent} testId="live-photo-wall-section">
            <Eyebrow accent={accent}>◆ Live Photo Wall</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Photos appear <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>live.</em>
            </SectionHeading>
            <p className="mt-3 text-sm" style={{ color: mutedText }}>
              The photographer's hand-picked moments stream here as the wedding unfolds.
            </p>
            <div className="mt-4">
              <button className="text-[11px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-md inline-flex items-center gap-2"
                style={{ color: pageBg, background: accent }}
                data-testid="dfp-live-wall-cta">
                <Camera className="w-3.5 h-3.5" /> View live wall
              </button>
            </div>
          </Panel>

          {/* FIND MY PHOTOS */}
          <Panel pageBg={pageBg} accent={accent} testId="find-photos-section">
            <Eyebrow accent={accent}>◆ AI-powered photo search</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Find <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>your photos</em> from the wedding.
            </SectionHeading>
            <p className="mt-3 text-sm" style={{ color: mutedText }}>
              Upload one selfie. Our AI will surface every photo of you from the day.
            </p>
            <div className="mt-4">
              <button className="text-[11px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-md inline-flex items-center gap-2"
                style={{ color: pageBg, background: accent }}
                data-testid="dfp-find-photos-cta">
                <Search className="w-3.5 h-3.5" /> Find My Photos
              </button>
            </div>
          </Panel>

          {/* TRAVEL & STAY */}
          {Array.isArray(sampleData?.travel) && sampleData.travel.length > 0 && (
            <Panel pageBg={pageBg} accent={accent} testId="travel-section">
              <Eyebrow accent={accent}>◆ Travel &amp; Stay</Eyebrow>
              <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
                How to <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>reach us.</em>
              </SectionHeading>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleData.travel.map((v, i) => {
                  const Icon = (v.type || '').toLowerCase().includes('airport') ? Plane
                    : (v.type || '').toLowerCase().includes('stay') ? Hotel
                    : Building2;
                  return (
                    <div key={i} className="px-4 py-3 rounded-md flex items-start gap-3"
                      style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}
                      data-testid={`dfp-travel-${i}`}>
                      <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
                        style={{ background: `${accent}25`, color: accent }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: mutedText }}>{v.type}</div>
                        <div className="text-base font-semibold" style={{ color: textOnBg, fontFamily: headingFont }}>{v.name}</div>
                        <div className="text-sm" style={{ color: mutedText }}>{v.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* GIFT REGISTRY */}
          {sampleData?.gifts && (
            <Panel pageBg={pageBg} accent={accent} testId="gifts-section">
              <Eyebrow accent={accent}><Gift className="w-3 h-3 inline-block mr-2 -mt-0.5" /> Gifts</Eyebrow>
              <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
                {sampleData.gifts.headline}
              </SectionHeading>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedText }}>
                {sampleData.gifts.message}
              </p>
            </Panel>
          )}

          {/* DIGITAL SHAGUN */}
          {sampleData?.shagun && (
            <Panel pageBg={pageBg} accent={accent} testId="shagun-section">
              <Eyebrow accent={accent}>◆ Digital Shagun</Eyebrow>
              <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
                Send your <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>blessings.</em>
              </SectionHeading>
              <p className="mt-3 text-sm" style={{ color: mutedText }}>{sampleData.shagun.msg}</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="px-4 py-3 rounded-md" style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}>
                  <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: mutedText }}>UPI ID</div>
                  <div className="font-mono text-sm" style={{ color: textOnBg }}>{sampleData.shagun.upi}</div>
                </div>
                <div className="px-4 py-3 rounded-md" style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}>
                  <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: mutedText }}>Payee</div>
                  <div className="text-sm" style={{ color: textOnBg }}>{sampleData.shagun.payee || `${text.bride} & ${text.groom}`}</div>
                </div>
              </div>
            </Panel>
          )}

          {/* MAJA REFERRAL */}
          <Panel pageBg={pageBg} accent={accent} testId="referral-section">
            <Eyebrow accent={accent}><Sparkles className="w-3 h-3 inline-block mr-2 -mt-0.5" /> Loved this invitation?</Eyebrow>
            <SectionHeading font={headingFont} color={textOnBg} accent={accent}>
              Crafted by <em style={{ color: accent, fontFamily: '"Great Vibes", cursive', fontStyle: 'italic' }}>MAJA Creations.</em>
            </SectionHeading>
            <p className="mt-3 text-sm" style={{ color: mutedText }}>
              Want one for your own wedding? Refer your photographer to MAJA and unlock cinematic invitations for any culture.
            </p>
          </Panel>

          {/* VARIANT SWITCHER */}
          <Panel pageBg={pageBg} accent={accent} compact>
            <div className="flex items-baseline justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] tracking-[0.5em] uppercase mb-2" style={{ color: accent }}>
                  ◈ {themeMeta.name} · {event} · Design {idx + 1}
                </div>
                <div className="text-xl md:text-2xl" style={{ fontFamily: headingFont, color: textOnBg }}>
                  {resolved.design.title}
                </div>
                <p className="text-sm max-w-xl mt-1.5" style={{ color: mutedText }}>{resolved.design.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <button key={i}
                    onClick={() => navigate(`/themes/${themeId}/events/${event}/design/${i}`)}
                    className="text-[11px] tracking-[0.25em] uppercase px-3 py-2 rounded-md"
                    style={{
                      color: i === idx ? pageBg : textOnBg,
                      background: i === idx ? accent : `${accent}15`,
                      border: `1px solid ${accent}66`,
                    }}
                    data-testid={`switch-design-${i}`}>
                    Design {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </main>

        {/* Edit panel */}
        {editMode && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 px-5 md:px-10 pb-6 pt-5"
            style={{
              background: `linear-gradient(0deg, ${pageBg}F4 0%, ${pageBg}AA 70%, ${pageBg}00 100%)`,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}
            data-testid="edit-text-panel"
          >
            <div className="max-w-5xl mx-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <EditField label="Bride" value={text.bride} onChange={(v) => setText(s => ({ ...s, bride: v }))} testId="edit-bride" accent={accent} textOnBg={textOnBg} pageBg={pageBg} />
                <EditField label="Groom" value={text.groom} onChange={(v) => setText(s => ({ ...s, groom: v }))} testId="edit-groom" accent={accent} textOnBg={textOnBg} pageBg={pageBg} />
                <EditField label="Date"  value={text.date}  onChange={(v) => setText(s => ({ ...s, date: v }))}  testId="edit-date"  accent={accent} textOnBg={textOnBg} pageBg={pageBg} />
                <EditField label="Venue" value={text.venue} onChange={(v) => setText(s => ({ ...s, venue: v }))} testId="edit-venue" accent={accent} textOnBg={textOnBg} pageBg={pageBg} />
              </div>
              <PhotoEditor
                value={text.photo}
                onChange={(v) => setText((s) => ({ ...s, photo: v }))}
                accent={accent} textOnBg={textOnBg} pageBg={pageBg}
              />
            </div>
          </motion.div>
        )}

        {/* page-level keyframes */}
        <style>{`
          @keyframes card-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes side-orb-drift {
            0%   { transform: translate(0,0)   rotate(0deg); }
            50%  { transform: translate(8px,-12px) rotate(8deg); }
            100% { transform: translate(0,0)   rotate(0deg); }
          }
        `}</style>

        {/* Closing-animation sentinel — when the photographer/customer
            scrolls to this element the per-theme closing fires. */}
        <div ref={footerRef} data-testid="dfp-closing-sentinel" style={{ height: 60 }} />
        {openingDone && (
          <ClosingOrchestrator
            themeId={themeId}
            eventType={event}
            image={resolved?.design?.image}
            bride={text.bride}
            groom={text.groom}
            date={text.date}
          />
        )}
      </div>
    </AnimationProvider>
  );
};

/* ────────────────────────────────────────────────────────────────────
   SoftDesignBackdrop — Renders the SAME design image as a soft, blurred
   full-viewport backdrop so the design extends edge-to-edge of the page
   (instead of just sitting inside a centered card on a flat shade). The
   center hero card still pops because it uses the crisp, un-blurred
   variant via UniversalDesignRenderer + a strong drop-shadow.
   ──────────────────────────────────────────────────────────────────── */
const SoftDesignBackdrop = ({ image, accent, pageBg = '#1A130B' }) => {
  if (!image) {
    // Pure-CSS fallback when no image URL (kept GPU-cheap)
    return (
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at top left, ${accent}1F 0%, transparent 55%),
            radial-gradient(ellipse at bottom right, ${accent}14 0%, transparent 60%),
            ${pageBg}
          `,
        }}
      />
    );
  }
  return (
    <>
      {/* Solid base colour underneath in case the image is still loading */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: pageBg,
        }}
      />
      {/* The actual design image, full-bleed, softened so the centred hero
          card remains the visual focal point. `cover` ensures it fills the
          viewport on every screen size. */}
      <img
        aria-hidden
        src={image}
        alt=""
        draggable={false}
        loading="eager"
        decoding="async"
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          width: '100%', height: '100%', objectFit: 'cover',
          // soft blur + slight scale to avoid hard crop edges
          filter: 'blur(28px) saturate(1.1)',
          transform: 'scale(1.08)',
          transformOrigin: 'center center',
          opacity: 0.65,
          willChange: 'transform',
        }}
      />
      {/* Tinting wash: keeps text legible on top of any image, and lets the
          design's natural palette (pageBg) breathe through. */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at center, transparent 0%, ${pageBg}66 70%, ${pageBg}AA 100%),
            linear-gradient(180deg, ${pageBg}33 0%, ${pageBg}55 100%)
          `,
        }}
      />
      {/* Soft accent orbs — kept from previous design for cinematic feel */}
      <div
        aria-hidden
        style={{
          position: 'fixed', left: '4vw', top: '40vh',
          width: 220, height: 220, zIndex: 1, pointerEvents: 'none',
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          filter: 'blur(20px)',
          animation: 'side-orb-drift 18s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed', right: '4vw', top: '60vh',
          width: 260, height: 260, zIndex: 1, pointerEvents: 'none',
          background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)`,
          filter: 'blur(22px)',
          animation: 'side-orb-drift 22s ease-in-out infinite reverse',
        }}
      />
    </>
  );
};

/* ────────────────────────────────────────────────────────────────────
   Panel — a translucent parchment-tinted container used by every
   section so the design backdrop is always visible underneath.
   ──────────────────────────────────────────────────────────────────── */
const Panel = ({ pageBg, accent, children, variant, compact, testId }) => {
  const isHero = variant === 'hero';
  return (
    <section
      data-testid={testId}
      className="relative px-6 md:px-16"
      style={{
        paddingTop:    isHero ? '3rem' : (compact ? '2.6rem' : '4.5rem'),
        paddingBottom: isHero ? '4rem' : (compact ? '2.6rem' : '4.5rem'),
      }}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl px-6 md:px-10 py-8 md:py-10"
        style={{
          background: isHero ? 'transparent' : `${pageBg}CC`,
          backdropFilter: isHero ? 'none' : 'blur(8px)',
          WebkitBackdropFilter: isHero ? 'none' : 'blur(8px)',
          border: isHero ? 'none' : `1px solid ${accent}44`,
          boxShadow: isHero ? 'none' : '0 16px 50px rgba(0,0,0,0.10)',
        }}
      >
        {children}
      </div>
    </section>
  );
};

const Eyebrow = ({ accent, children }) => (
  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: accent }}>{children}</div>
);

const SectionHeading = ({ children, font, color }) => (
  <h2
    className="leading-tight"
    style={{ fontFamily: font, color, fontSize: 'clamp(1.6rem, 3.2vw, 2.5rem)' }}
  >
    {children}
  </h2>
);

const EditField = ({ label, value, onChange, testId, accent, textOnBg, pageBg }) => (
  <label className="block">
    <span
      className="text-[10px] tracking-[0.3em] uppercase block mb-1.5 font-semibold"
      style={{ color: textOnBg, opacity: 0.85 }}
    >
      {label}
    </span>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-md text-[15px] outline-none"
      style={{ background: `${pageBg}EE`, color: textOnBg, border: `1px solid ${accent}77`, fontFamily: '"Cormorant Garamond", serif' }}
      data-testid={testId} />
  </label>
);

/* ────────────────────────────────────────────────────────────────────
   PhotoEditor — drag-and-drop file upload + click to upload + URL paste
   ──────────────────────────────────────────────────────────────────── */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

const PhotoEditor = ({ value, onChange, accent, textOnBg, pageBg }) => {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const ingestFile = useCallback((file) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file (jpg / png / webp).');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Image is larger than 5 MB. Pick a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.onerror = () => setError('Could not read the file.');
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) ingestFile(file);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onFilePick = (e) => { const f = e.target.files?.[0]; if (f) ingestFile(f); };
  const onUrlApply = () => {
    if (!urlInput.trim()) return;
    setError('');
    onChange(urlInput.trim());
    setUrlInput('');
  };

  return (
    <div className="rounded-md p-3" style={{ background: `${pageBg}EE`, border: `1px solid ${accent}55` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: accent }}>Couple Photo</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-1 opacity-75 hover:opacity-100"
            style={{ color: textOnBg }}
            data-testid="clear-photo"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {/* Drop / upload zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-md cursor-pointer transition-colors"
          style={{
            border: `2px dashed ${dragOver ? accent : accent + '66'}`,
            background: dragOver ? `${accent}18` : 'transparent',
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
          data-testid="photo-dropzone"
        >
          {value ? (
            <img
              src={value}
              alt="Couple"
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `${accent}18`, flexShrink: 0 }}>
              <ImageIcon className="w-6 h-6" style={{ color: accent }} />
            </div>
          )}
          <div className="text-left">
            <div className="text-[12px] font-medium inline-flex items-center gap-1.5" style={{ color: textOnBg }}>
              <Upload className="w-3.5 h-3.5" /> Drag &amp; drop or click to upload
            </div>
            <div className="text-[10px] mt-0.5 opacity-75" style={{ color: textOnBg }}>
              JPG / PNG / WEBP, up to 5&nbsp;MB
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFilePick} className="hidden" data-testid="photo-file-input" />
        </div>

        {/* URL input */}
        <div className="flex-1 rounded-md flex items-stretch gap-2" style={{ border: `1px solid ${accent}55`, padding: 6 }}>
          <span className="grid place-items-center px-2" style={{ color: accent }}><LinkIcon className="w-4 h-4" /></span>
          <input
            type="url"
            value={urlInput}
            placeholder="…or paste an image URL"
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onUrlApply(); } }}
            className="flex-1 px-2 py-2 rounded-md text-[13px] outline-none"
            style={{ background: 'transparent', color: textOnBg, border: 'none' }}
            data-testid="photo-url-input"
          />
          <button
            type="button"
            onClick={onUrlApply}
            className="px-3 text-[10px] tracking-[0.25em] uppercase rounded-md"
            style={{ background: accent, color: pageBg, border: `1px solid ${accent}` }}
            data-testid="photo-url-apply"
          >
            Use
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] mt-2" style={{ color: '#B83A2C' }} data-testid="photo-error">{error}</div>
      )}
    </div>
  );
};

/* Quick brightness check on a #RRGGBB string — true if light (need dark text) */
function isLightHex(hex) {
  return isLightColor(hex);
}

export default DesignFullPreview;
