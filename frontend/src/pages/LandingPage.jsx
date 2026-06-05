import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import axios from 'axios';
import {
  Sparkles, Camera, Crown, Wallet, ShieldCheck, Layers, ArrowRight,
  Heart, Music, Image as ImageIcon, QrCode, Globe2, MessageCircle, Star, MapPin,
  X as XIcon, IndianRupee, Coins, Check,
} from 'lucide-react';
import '../styles/luxury.css';
import HeroMandala3D from '../components/luxury/HeroMandala3D';
import { resolveHeroDesign } from '../themes/themeDesignResolver';
import { getThemeById } from '../themes/masterThemes';
import UserAuthModal from '../components/UserAuthModal';
import { useUserAuth } from '../context/UserAuthContext';
import { getThemeDesignsAsync } from '../themes/allDesigns';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
import UniversalDesignRenderer from '../themes/UniversalDesignRenderer';
import { getThemeSampleData } from '../themes/sampleData';

/* Default sample photo for every preview tile (the per-theme dummy text
   comes from THEME_SAMPLE_DATA). */
const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop&q=85';

const sampleFor = (themeId) => {
  const s = getThemeSampleData(themeId) || {};
  return {
    bride: s.bride || 'Anaya',
    groom: s.groom || 'Vihaan',
    date:  s.weddingDate || '14 February 2026',
    venue: `${s.venue || 'Falaknuma Palace'}${s.city ? ' · ' + s.city.split(',')[0] : ''}`,
    photo: SAMPLE_PHOTO,
  };
};

/* ──────────────────────────────────────────────────────────────
   Premium B2B SaaS Landing for Indian Wedding Photographers
   Palette: Royal Heritage (Crimson + Champagne Gold + Ivory + Charcoal)
   ────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 36, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/* The 10 cinematic master themes (per spec) */
const MASTER_THEMES = [
  { id: 'royal_mughal',         name: 'Royal Mughal',         palette: ['#8B0000', '#D4AF37', '#FFF8DC'], hint: 'Crimson · Gold · Ivory' },
  { id: 'south_indian_temple',  name: 'South Indian Temple',  palette: ['#D4AF37', '#420D09', '#F5E6BE'], hint: 'Gold · Maroon · Parchment' },
  { id: 'modern_minimal',       name: 'Modern Minimal',       palette: ['#DCAE96', '#8A9A5B', '#F5F5DC'], hint: 'Dusty Rose · Sage · Sand' },
  { id: 'beach_destination',    name: 'Beach Destination',    palette: ['#005F69', '#BFA379', '#F2D2BD'], hint: 'Teal · Bronze · Peach' },
  { id: 'punjabi_sangeet',      name: 'Punjabi Sangeet',      palette: ['#4B0082', '#C0C0C0', '#FFFFFF'], hint: 'Imperial Purple · Silver' },
  { id: 'bengali_traditional',  name: 'Bengali Traditional',  palette: ['#8B0000', '#FFFFFF', '#D4AF37'], hint: 'Red · White · Gold' },
  { id: 'christian_elegant',    name: 'Christian Elegant',    palette: ['#3D2B1F', '#F5F5DC', '#DCAE96'], hint: 'Mocha · Sand · Rose' },
  { id: 'muslim_nikah',         name: 'Muslim Nikah',         palette: ['#355E3B', '#D4AF37', '#FFF8DC'], hint: 'Hunter Green · Gold' },
  { id: 'nature_eco_wedding',   name: 'Nature / Eco Wedding', palette: ['#8A9A5B', '#E97451', '#F5F5DC'], hint: 'Sage · Terracotta · Sand' },
  { id: 'kerala_backwaters',     name: 'Kerala Backwaters',    palette: ['#0B3D45', '#D4A24C', '#E85A8A'], hint: 'Teal · Gold · Lotus' },
];

const FEATURES = [
  { icon: Crown,       title: 'Locked Premium Themes',     copy: 'Photographers can never break design. Curated luxury layouts only.' },
  { icon: Wallet,      title: 'Credit-Based Publishing',   copy: 'Drafts are free. Credits consume only on publish. Never expire.' },
  { icon: Camera,      title: 'Live Photo Galleries',      copy: 'Stream wedding moments to guests in real-time, beautifully.' },
  { icon: Sparkles,    title: 'AI Story Composer',         copy: 'Cinematic captions, vows, and event copy in seconds.' },
  { icon: Music,       title: 'Persistent Ambient Music',  copy: 'Crossfaded between sections — never breaks the spell.' },
  { icon: ImageIcon,   title: '3D Unfolding Invitation',   copy: 'Wax-seal opening, scroll storytelling, parallax depth.' },
  { icon: QrCode,      title: 'QR + Digital Shagun',       copy: 'Frictionless RSVP, gifts and entry passes for every guest.' },
  { icon: Globe2,      title: 'Multi-Language',            copy: 'Hindi, Tamil, Telugu, Bengali, Urdu, English & more.' },
  { icon: ShieldCheck, title: 'Private & Secure',          copy: 'Passcode invites, anti-scraping, RBAC, audit trails.' },
];

const STATS = [
  { value: '10',  label: 'Master Themes' },
  { value: '60+', label: 'Premium Sections' },
  { value: '8',   label: 'Indian Wedding Cultures' },
  { value: '∞',   label: 'Drafts per Photographer' },
];

const PLANS = [
  { name: 'Free',     credits: '5',  price: '₹0',     perks: ['Watermark', 'Royal Mughal theme', 'Basic analytics', 'Email support'] },
  { name: 'Silver',   credits: '25', price: '₹2,499', perks: ['No watermark', '4 themes unlocked', 'Full analytics', 'Priority support'] },
  { name: 'Gold',     credits: '60', price: '₹5,999', perks: ['8 themes unlocked', 'Live gallery', 'AI story composer', 'Custom domain'] },
  { name: 'Platinum', credits: '∞',  price: '₹14,999',perks: ['All 10 themes', '3D invitations', 'Dedicated manager', 'White-label option'] },
];

const Nav = ({ onLogin, user, onOpenAuth, onLogout, onBuyCredits, onUserDashboard }) => (
  <motion.nav
    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
    className="fixed top-0 inset-x-0 z-50 px-4 md:px-12 py-3 md:py-5 flex items-center justify-between gap-2"
    style={{ background: 'linear-gradient(180deg, rgba(14,10,6,0.92), rgba(14,10,6,0.55))', backdropFilter: 'blur(8px)' }}
    data-testid="lux-nav"
  >
    <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
      <img src="/brand/maja-icon-64.png" alt="MAJA Creations"
        className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shrink-0"
        style={{ boxShadow: '0 0 0 1px var(--lux-border-strong), inset 0 0 0 1px rgba(232,199,102,0.18)' }} />
      <span className="font-display text-base md:text-[1.35rem] tracking-wide whitespace-nowrap truncate" style={{ color: '#FFF8DC' }}>
        MAJA<span className="text-gold"> </span>Creations
      </span>
    </div>
    <div className="hidden md:flex items-center gap-9 text-[0.82rem] tracking-[0.18em] uppercase" style={{ color: 'rgba(255,248,220,0.7)' }}>
      <a href="#themes" className="hover:text-[var(--lux-gold)] transition-colors">Themes</a>
      <a href="#features" className="hover:text-[var(--lux-gold)] transition-colors">Features</a>
      <a href="#pricing" className="hover:text-[var(--lux-gold)] transition-colors">Plans</a>
      <a href="#story" className="hover:text-[var(--lux-gold)] transition-colors">Story</a>
    </div>
    <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
      {user ? (
        <>
          <button
            onClick={onUserDashboard}
            className="lux-btn lux-btn-ghost !px-3 !py-2 md:!px-5 md:!py-2.5 !text-[10px] md:!text-xs whitespace-nowrap hidden sm:inline-flex"
            data-testid="nav-user-dashboard"
          >
            My Studio
          </button>
          <button
            onClick={onBuyCredits}
            className="lux-btn !px-3 !py-2 md:!px-5 md:!py-2.5 !text-[10px] md:!text-xs whitespace-nowrap"
            data-testid="nav-buy-credits"
          >
            <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden xs:inline">Credits ·</span> {user.credits ?? 0}
          </button>
          <button onClick={onLogout}
            aria-label="Sign out"
            className="w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-full grid place-items-center md:inline md:rounded-full text-[10px] tracking-[0.25em] uppercase hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,248,220,0.65)', border: '1px solid var(--lux-border)' }}
            data-testid="nav-user-logout"
          >
            <span className="hidden md:inline">Sign out</span>
            <span className="md:hidden text-base">↗</span>
          </button>
        </>
      ) : (
        <button onClick={onOpenAuth}
          className="lux-btn lux-btn-ghost !px-3 !py-2 md:!px-5 md:!py-2.5 !text-[10px] md:!text-xs whitespace-nowrap"
          data-testid="nav-user-signin"
        >
          Sign in
        </button>
      )}
      {/* Photographer Studio entry — only when no user is signed in,
          so the normal user header stays clean (Credits + Sign out + My Profile). */}
      {!user && (
        <button onClick={onLogin}
          className="lux-btn !px-3 !py-2 md:!px-5 md:!py-2.5 !text-[10px] md:!text-xs whitespace-nowrap"
          data-testid="nav-photographer-login"
        >
          <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 md:hidden" />
          <span className="hidden md:inline">Photographer</span>
          <span className="md:hidden">Studio</span>
        </button>
      )}
    </div>
  </motion.nav>
);

/* Bucket 2 — Floating mandala decoration for the landing hero. Pure CSS keyframe,
   GPU-friendly transform, no scroll listeners. */
const FloatingHeroMandala = ({ size = 120, top, left, right, bottom, duration = 16, delay = 0, opacity = 0.3, flip = false }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      top, left, right, bottom,
      width: size, height: size,
      opacity,
      pointerEvents: 'none',
      transform: flip ? 'scaleX(-1)' : undefined,
      animation: `landing-mandala-float ${duration}s ease-in-out ${delay}s infinite`,
      zIndex: 1,
    }}
  >
    <style>{`@keyframes landing-mandala-float {
      0%,100% { transform: translateY(0) rotate(0deg) ${flip ? 'scaleX(-1)' : ''}; }
      50%     { transform: translateY(-18px) rotate(10deg) ${flip ? 'scaleX(-1)' : ''}; }
    }`}</style>
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {[...Array(12)].map((_, i) => (
        <ellipse
          key={i}
          cx="50" cy="22" rx="3.5" ry="14"
          fill="#D4AF37"
          opacity={0.5 - (i % 3) * 0.1}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="3.5" fill="#E8C766" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.6" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.4" strokeDasharray="2 3" />
    </svg>
  </div>
);

const Hero = ({ onLogin }) => {
  // Removed scroll-tied parallax — useScroll/useTransform was firing every
  // frame and causing mid-page scroll jank. Kept the entry animation only.
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 md:pt-32 pb-16 md:pb-24 px-5 md:px-16 overflow-hidden">
      {/* Sprint 11 — Cinematic 3D rotating gold mandala + dust */}
      <HeroMandala3D />

      {/* Decorative orbits */}
      <div className="lux-orbit" style={{ width: 720, height: 720, top: -180, right: -180 }} />
      <div className="lux-orbit" style={{ width: 1100, height: 1100, top: -360, right: -360, opacity: 0.5 }} />

      {/* Bucket 2 — Floating mandala decorations (gentle CSS-only float). */}
      {!reduce && (
        <>
          <FloatingHeroMandala size={120} top="14%" left="4%" duration={14} delay={0} opacity={0.30} />
          <FloatingHeroMandala size={150} bottom="18%" left="10%" duration={18} delay={3} opacity={0.22} flip />
          <FloatingHeroMandala size={100} top="38%" right="18%" duration={16} delay={1.5} opacity={0.26} />
        </>
      )}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-6xl"
      >
        <motion.span variants={fadeUp} initial="hidden" animate="visible" custom={0} className="lux-eyebrow inline-block mb-4 md:mb-6 text-[10px] md:text-xs">
          ◆ Premium SaaS for Indian Wedding Photographers
        </motion.span>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="font-display leading-[0.98] text-[2.4rem] xs:text-[2.8rem] sm:text-[3.4rem] md:text-[6.6rem] tracking-tight"
          style={{ color: '#FFF8DC' }}
        >
          Cinematic <span className="text-gold italic font-script font-light">invitations</span>
          <br />
          worthy of your <em className="not-italic text-gold">artistry.</em>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="mt-5 md:mt-8 max-w-2xl text-[0.95rem] md:text-[1.18rem] leading-[1.6] md:leading-[1.7]"
          style={{ color: 'rgba(255,248,220,0.72)' }}
        >
          A locked-luxury invitation platform built for photographers who refuse mediocrity.
          Royal Mughal to Bengali Traditional — every theme stays elegant in every hand.
          You charge premium. We protect the design.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-7 md:mt-10 flex flex-wrap items-center gap-3 md:gap-4">
          <button className="lux-btn w-full sm:w-auto justify-center" onClick={onLogin} data-testid="hero-cta-login">
            Enter Studio <ArrowRight className="w-4 h-4" />
          </button>
          <a href="#themes" className="lux-btn lux-btn-ghost w-full sm:w-auto justify-center" data-testid="hero-cta-themes">
            Explore Themes
          </a>
          <a
            href="/invite/testgroom-testbride-9zx0ws"
            target="_blank"
            rel="noopener noreferrer"
            className="lux-btn lux-btn-ghost w-full sm:w-auto justify-center"
            style={{ borderColor: 'rgba(212,175,55,0.55)', color: '#E8C766' }}
            data-testid="hero-cta-sample"
          >
            <Sparkles className="w-4 h-4" /> See a Live Sample
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="mt-10 md:mt-16 flex items-center gap-4 md:gap-6 text-[10px] md:text-xs tracking-widest uppercase"
          style={{ color: 'rgba(255,248,220,0.55)' }}
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_,i)=>(<Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: '#D4AF37' }} fill="#D4AF37" />))}
          </div>
          <span className="leading-tight">Trusted by 1,200+ Indian photographers · 38 cities</span>
        </motion.div>
      </motion.div>

      {/* Floating side card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22,1,0.36,1] }}
        className="hidden lg:block lux-glass absolute right-12 bottom-20 w-[320px] p-6"
      >
        <div className="lux-eyebrow mb-3">Today · Studio Pulse</div>
        <div className="flex items-end gap-3 mb-4">
          <span className="font-display text-5xl text-gold">12</span>
          <span className="pb-2 text-sm" style={{ color: 'rgba(255,248,220,0.65)' }}>weddings published this week</span>
        </div>
        <div className="lux-hairline my-4" />
        <div className="flex items-center justify-between text-sm" style={{ color: 'rgba(255,248,220,0.75)' }}>
          <span>Credits remaining</span>
          <span className="font-display text-2xl text-gold">182</span>
        </div>
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,248,220,0.08)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.6, delay: 1, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #B8902B, #E8C766)' }} />
        </div>
      </motion.div>
    </section>
  );
};

const SectionHeader = ({ eyebrow, title, kicker }) => (
  <motion.div
    variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}
    className="max-w-3xl mb-16"
  >
    <motion.span variants={fadeUp} className="lux-eyebrow block mb-5">◆ {eyebrow}</motion.span>
    <motion.h2 variants={fadeUp} className="font-display text-[2.4rem] md:text-[3.6rem] leading-[1.05] tracking-tight" style={{ color: '#FFF8DC' }}>
      {title}
    </motion.h2>
    {kicker && (
      <motion.p variants={fadeUp} className="mt-5 text-[1.02rem] leading-relaxed max-w-xl" style={{ color: 'rgba(255,248,220,0.65)' }}>
        {kicker}
      </motion.p>
    )}
  </motion.div>
);

const Themes = ({ navigate }) => {
  const [hovered, setHovered] = useState({});
  return (
  <section id="themes" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Master Theme Library"
      title="Ten cinematic worlds. Zero design destruction."
      kicker="Each theme is a locked layout with curated typography and motion. Photographers customize accent colors and content — never break the soul of the design."
    />

    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="themes-grid"
    >
      {MASTER_THEMES.map((t, i) => {
        const themeDesign = resolveHeroDesign(t.id);
        const SAMPLE = sampleFor(t.id);
        const masterTheme = getThemeById(t.id);
        const themeCredits = masterTheme?.creditCost ?? 1;
        const themePlan = masterTheme?.planRequired || 'FREE';
        return (
        <motion.button
          type="button"
          key={t.id} variants={fadeUp} custom={i}
          whileHover={{ scale: 1.01, transition: { duration: 0.25, ease: 'easeOut' } }}
          onMouseEnter={() => {
            try { setHovered((h) => ({ ...h, [t.id]: true })); } catch (_) {}
            // PHASE 9 (perf): warm the theme chunk + first design image on hover so
            // click feels instant. No-op if chunk already cached.
            try { getThemeDesignsAsync(t.id); } catch (_) {}
          }}
          onTouchStart={() => {
            try { setHovered((h) => ({ ...h, [t.id]: true })); } catch (_) {}
            try { getThemeDesignsAsync(t.id); } catch (_) {}
          }}
          onClick={() => navigate(`/themes/${t.id}/events`)}
          className="lux-glass p-5 group cursor-pointer text-left w-full overflow-hidden relative"
          data-testid={`theme-card-${t.id}`}
          aria-label={`Preview ${t.name}`}
        >
          {/* Credit badge — top-right corner */}
          <div
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.95), rgba(180,140,40,0.9))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,248,220,0.35)',
            }}
            data-testid={`theme-credit-badge-${t.id}`}
          >
            <Coins className="w-3 h-3" style={{ color: '#16110C' }} strokeWidth={2.4} />
            <span className="font-display text-xs leading-none" style={{ color: '#16110C', fontWeight: 700 }}>
              {themeCredits} credit{themeCredits > 1 ? 's' : ''}
            </span>
          </div>
          {/* Plan badge — top-left corner */}
          <div
            className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase"
            style={{
              background: themePlan === 'FREE' ? 'rgba(138,154,91,0.2)'
                       : themePlan === 'SILVER' ? 'rgba(192,192,192,0.2)'
                       : themePlan === 'GOLD' ? 'rgba(212,175,55,0.2)'
                       : 'rgba(139,0,0,0.25)',
              color: themePlan === 'FREE' ? '#A8C076'
                  : themePlan === 'SILVER' ? '#D8D8D8'
                  : themePlan === 'GOLD' ? '#E8C766'
                  : '#FFB0A0',
              border: '1px solid rgba(255,248,220,0.2)',
            }}
            data-testid={`theme-plan-badge-${t.id}`}
          >
            {themePlan}
          </div>
          {/* Live invitation preview — 2026-05 perf overhaul: the first
              3 cards (above the fold) get the full renderer eagerly. The
              rest start with just the poster image and only mount the
              full renderer on hover/tap so the landing grid feels
              instant. The full renderer takes over once the user shows
              intent to engage. */}
          {themeDesign?.design && themeDesign?.theme && (
            <div className="relative w-full mb-5 overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-[1.01]">
              {(i < 3 || hovered[t.id]) ? (
                <UniversalDesignRenderer
                  design={themeDesign.design}
                  theme={themeDesign.theme}
                  bride={SAMPLE.bride}
                  groom={SAMPLE.groom}
                  date={SAMPLE.date}
                  venue={SAMPLE.venue}
                  photo={SAMPLE.photo}
                  eager={i < 3}
                  testId={`theme-preview-${t.id}`}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '2 / 3',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: themeDesign.design?.image
                      ? `center / cover no-repeat url(${themeDesign.design.image})`
                      : 'linear-gradient(135deg,#2a1d0e,#0a0a0a)',
                    // Phase 3A: neutral dark fallback (not theme-tinted) so
                    // beach / christian / muslim themes don't flash a blue ghost.
                    backgroundColor: '#0a0a0a',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                  }}
                  data-testid={`theme-preview-poster-${t.id}`}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.45)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex -space-x-1.5">
              {t.palette.map((c, idx) => (
                <span key={idx}
                  className="w-5 h-5 rounded-full border"
                  style={{ background: c, borderColor: 'rgba(255,248,220,0.2)' }}
                />
              ))}
            </div>
          </div>
          <h3 className="font-display text-2xl md:text-[1.55rem] leading-tight mb-2" style={{ color: '#FFF8DC' }}>
            {t.name}
          </h3>
          <p className="text-sm" style={{ color: 'rgba(255,248,220,0.55)' }}>{t.hint}</p>
          <div className="lux-hairline my-4" />
          <div className="flex items-center justify-between text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,248,220,0.55)' }}>
            <span>18 designs · 6 events</span>
            <span className="group-hover:text-[var(--lux-gold)] transition-colors flex items-center gap-1">
              Preview <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.button>
        );
      })}
    </motion.div>
  </section>
  );
};

const Features = () => (
  <section id="features" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Photographer Toolkit"
      title="Every detail crafted for your business."
      kicker="A wizard-driven studio that protects your design integrity while giving guests an experience they will never forget."
    />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      data-testid="features-grid"
    >
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title} variants={fadeUp} custom={i}
          className="lux-glass p-7 flex flex-col gap-4 hover:scale-[1.01] transition-transform duration-700"
          data-testid={`feature-card-${i}`}
        >
          <div className="w-11 h-11 rounded-xl grid place-items-center"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(139,0,0,0.18))', border: '1px solid var(--lux-border-strong)' }}>
            <f.icon className="w-5 h-5" style={{ color: '#D4AF37' }} strokeWidth={1.6} />
          </div>
          <h3 className="font-heading text-xl" style={{ color: '#FFF8DC' }}>{f.title}</h3>
          <p className="text-[0.95rem] leading-relaxed" style={{ color: 'rgba(255,248,220,0.6)' }}>{f.copy}</p>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

const Stats = () => (
  <section className="px-6 md:px-16 py-20 z-10 relative">
    <div className="lux-hairline mb-16" />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8"
    >
      {STATS.map((s, i) => (
        <motion.div key={i} variants={fadeUp} custom={i} className="text-center md:text-left">
          <div className="font-display text-5xl md:text-6xl text-gold mb-2">{s.value}</div>
          <div className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>{s.label}</div>
        </motion.div>
      ))}
    </motion.div>
    <div className="lux-hairline mt-16" />
  </section>
);

const Story = () => (
  <section id="story" className="relative px-6 md:px-16 py-28 z-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <motion.div
        variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span variants={fadeUp} className="lux-eyebrow block mb-5">◆ Our Philosophy</motion.span>
        <motion.h2 variants={fadeUp} className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.1] mb-7" style={{ color: '#FFF8DC' }}>
          Indian weddings deserve <span className="text-gold italic font-script">cinema</span>, not templates.
        </motion.h2>
        <motion.p variants={fadeUp} className="text-[1.05rem] leading-[1.85] mb-6" style={{ color: 'rgba(255,248,220,0.7)' }}>
          We built MAJA Creations for the artist behind the camera — the photographer who has shot 200 weddings
          and is tired of cheap, flashy invitation builders that ruin their brand.
        </motion.p>
        <motion.p variants={fadeUp} className="text-[1.05rem] leading-[1.85]" style={{ color: 'rgba(255,248,220,0.7)' }}>
          Every theme here is curated like a Bollywood title sequence: slow, royal, immersive.
          Wax-seal openings. Parallax stories. Glassmorphism. Mandalas that breathe.
          Your couples will weep. Your competitors will scramble.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, rotateY: -15, scale: 0.94 }} whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.1 }}
        className="lux-glass p-10 relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full grid place-items-center"
          style={{ background: 'radial-gradient(circle at 30% 30%, #E8C766, #8C6A1A)' }}>
          <Crown className="w-6 h-6" style={{ color: '#16110C' }} />
        </div>
        <div className="lux-eyebrow mb-4">Customer Verdict</div>
        <p className="font-heading text-2xl md:text-[1.85rem] leading-[1.35] italic mb-6" style={{ color: '#FFF8DC' }}>
          “We doubled our wedding package price the month we moved to MAJA Creations.
          Couples opened the invite and cried before the wedding even happened.”
        </p>
        <div className="lux-hairline mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg, #8B0000, #D4AF37)' }} />
          <div>
            <div className="font-heading text-lg" style={{ color: '#FFF8DC' }}>Anaya Mehta</div>
            <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>Studio Aurora · Mumbai</div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ──────────────────────────────────────────────────────────────
   Invitation Options — all features included in an invitation link
   with default credit pricing visible to visitors.
   ────────────────────────────────────────────────────────────── */
const INVITATION_OPTIONS = [
  { icon: Heart,         title: 'Wax-Seal Opening',       desc: 'Cinematic 3D unfolding intro.',                     credits: 0,  included: true  },
  { icon: ImageIcon,     title: 'Couple + Bride/Groom Photos', desc: 'Portrait gallery with full bios.',             credits: 0,  included: true  },
  { icon: Music,         title: 'Background Music',       desc: '60+ curated tracks across 6 categories.',           credits: 0,  included: true  },
  { icon: Sparkles,      title: 'Live Countdown',         desc: 'Real-time ticker to the muhurat.',                  credits: 0,  included: true  },
  { icon: MessageCircle, title: 'Guest Wishes & RSVP',    desc: 'Public wishes wall + RSVP form.',                   credits: 0,  included: true  },
  { icon: Globe2,        title: 'Multi-language Invite',  desc: 'Hindi · Tamil · Telugu · Bengali · Urdu · English', credits: 1,  included: false },
  { icon: QrCode,        title: 'QR Code Entry Pass',     desc: 'Per-guest scannable QR codes.',                     credits: 2,  included: false },
  { icon: Sparkles,      title: 'AI Story Composer',      desc: 'Gemini-powered love story & event copy.',           credits: 2,  included: false },
  { icon: Camera,        title: 'Live Photo Gallery',     desc: 'Stream wedding moments to guests in real-time.',    credits: 3,  included: false },
  { icon: IndianRupee,   title: 'Digital Shagun · UPI/QR',desc: 'Accept gifts via Razorpay / UPI / QR.',             credits: 3,  included: false },
  { icon: MapPin,        title: 'Smart Venue Maps',       desc: 'Per-event Google Maps + parking guidance.',         credits: 1,  included: false },
  { icon: ShieldCheck,   title: 'Passcode-Protected Link',desc: 'Private invite — only your guests can enter.',      credits: 1,  included: false },
];

// MapPin/IndianRupee are imported below
const InvitationOptions = () => (
  <section id="invitation-options" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="What's Inside The Invite"
      title="Every option, transparently priced."
      kicker="Five staples are baked into every link for free. Premium features add a few credits — pick only what your couple needs."
    />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      data-testid="invitation-options-grid"
    >
      {INVITATION_OPTIONS.map((opt, i) => (
        <motion.div
          key={opt.title} variants={fadeUp} custom={i}
          whileHover={{ y: -4 }}
          className="lux-glass p-6 relative overflow-hidden"
          data-testid={`option-card-${opt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
        >
          {/* Credit badge top-right */}
          <div
            className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: opt.included
                ? 'linear-gradient(135deg, rgba(138,154,91,0.85), rgba(100,120,70,0.85))'
                : 'linear-gradient(135deg, rgba(212,175,55,0.95), rgba(180,140,40,0.9))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,248,220,0.3)',
            }}
            data-testid={`option-credit-${opt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            {opt.included ? (
              <>
                <Check className="w-3 h-3" style={{ color: '#0F1A06' }} strokeWidth={3} />
                <span className="font-display text-[10px] tracking-wider uppercase leading-none" style={{ color: '#0F1A06', fontWeight: 700 }}>
                  Included
                </span>
              </>
            ) : (
              <>
                <Coins className="w-3 h-3" style={{ color: '#16110C' }} strokeWidth={2.4} />
                <span className="font-display text-xs leading-none" style={{ color: '#16110C', fontWeight: 700 }}>
                  +{opt.credits}
                </span>
              </>
            )}
          </div>

          <div className="w-11 h-11 rounded-xl grid place-items-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(139,0,0,0.18))',
                     border: '1px solid var(--lux-border-strong)' }}>
            <opt.icon className="w-5 h-5" style={{ color: '#D4AF37' }} strokeWidth={1.6} />
          </div>
          <h3 className="font-heading text-lg mb-2 pr-20" style={{ color: '#FFF8DC' }}>{opt.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,248,220,0.65)' }}>{opt.desc}</p>
        </motion.div>
      ))}
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="text-center text-xs tracking-[0.25em] uppercase mt-10"
      style={{ color: 'rgba(255,248,220,0.55)' }}
      data-testid="invitation-options-note"
    >
      ◆ Base theme cost is shown on each theme card · Credits add up only on publish ◆
    </motion.p>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="relative px-6 md:px-16 py-28 z-10">
    <SectionHeader
      eyebrow="Studio Plans"
      title="Pay for credit. Never for time."
      kicker="Credits never expire. Drafts are free. You only spend a credit when you publish a wedding — that's it."
    />
    <motion.div
      variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      data-testid="pricing-grid"
    >
      {PLANS.map((p, i) => {
        const featured = i === 2; // Gold featured
        return (
          <motion.div
            key={p.name} variants={fadeUp} custom={i}
            whileHover={{ y: -6 }}
            className={`lux-glass p-7 flex flex-col ${featured ? 'ring-1' : ''}`}
            style={featured ? { borderColor: 'var(--lux-gold)', background: 'rgba(212,175,55,0.07)' } : undefined}
            data-testid={`plan-card-${p.name.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>{p.name}</h3>
              {featured && <span className="text-[10px] tracking-[0.25em] uppercase px-2 py-1 rounded-full" style={{ color: '#16110C', background: '#D4AF37' }}>Studio Pick</span>}
            </div>
            <div className="font-display text-5xl text-gold mb-1">{p.credits}</div>
            <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>credits included</div>
            {p.price && (
              <div className="flex items-baseline gap-1 mb-6" data-testid={`plan-price-${p.name.toLowerCase()}`}>
                <span className="font-display text-xl" style={{ color: '#FFF8DC' }}>{p.price}</span>
                <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,248,220,0.5)' }}>/ pack</span>
              </div>
            )}
            <div className="lux-hairline mb-5" />
            <ul className="flex-1 space-y-3 text-sm" style={{ color: 'rgba(255,248,220,0.75)' }}>
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                  {perk}
                </li>
              ))}
            </ul>
            <button className={`mt-7 ${featured ? 'lux-btn' : 'lux-btn lux-btn-ghost'} justify-center`} data-testid={`plan-cta-${p.name.toLowerCase()}`}>
              Choose {p.name}
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  </section>
);

const CTA = ({ onLogin }) => (
  <section className="relative px-6 md:px-16 py-32 z-10">
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="lux-glass relative overflow-hidden p-12 md:p-20 text-center"
      style={{ background: 'linear-gradient(135deg, rgba(139,0,0,0.25), rgba(212,175,55,0.08))', borderColor: 'var(--lux-border-strong)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(212,175,55,0.18), transparent 70%)' }} />
      <span className="lux-eyebrow block mb-4">◆ Begin Your Studio</span>
      <h2 className="font-display text-[2.6rem] md:text-[4.2rem] leading-[1.05] mb-6" style={{ color: '#FFF8DC' }}>
        Your next couple deserves <span className="text-gold italic font-script">a masterpiece.</span>
      </h2>
      <p className="max-w-xl mx-auto text-[1.05rem] mb-9" style={{ color: 'rgba(255,248,220,0.7)' }}>
        Sign in to your studio. Build a wedding in 12 minutes. Publish in one credit.
        Make couples cry the elegant way.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onLogin} className="lux-btn" data-testid="footer-cta-login">
          Enter Studio <ArrowRight className="w-4 h-4" />
        </button>
        <a href="#themes" className="lux-btn lux-btn-ghost" data-testid="footer-cta-themes">View Themes</a>
      </div>
    </motion.div>
  </section>
);

const Footer = ({ onSuperAdmin }) => (
  <footer className="relative z-10 px-6 md:px-16 py-12 border-t" style={{ borderColor: 'var(--lux-border)' }}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-sm">
      <div className="flex items-center gap-3">
        <img src="/brand/maja-icon-64.png" alt="MAJA Creations"
          className="w-7 h-7 rounded-full object-cover"
          style={{ boxShadow: '0 0 0 1px var(--lux-border-strong)' }} />
        <span className="font-display text-lg" style={{ color: '#FFF8DC' }}>MAJA<span className="text-gold"> </span>Creations</span>
      </div>
      <div className="flex flex-wrap items-center gap-6" style={{ color: 'rgba(255,248,220,0.55)' }}>
        <span>© {new Date().getFullYear()} MAJA Creations · Made in India</span>
        <a href="#features" className="hover:text-[var(--lux-gold)] transition-colors">Features</a>
        <a href="#pricing" className="hover:text-[var(--lux-gold)] transition-colors">Plans</a>
        <button onClick={onSuperAdmin} className="hover:text-[var(--lux-gold)] transition-colors text-left" data-testid="footer-super-admin-link">
          Super Admin
        </button>
      </div>
    </div>
  </footer>
);

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const PublicCreditsModal = ({ open, onClose, user, onPurchased }) => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    axios.get(`${API_URL}/api/public/credit-packs`)
      .then((r) => setPacks(r.data?.packs || []))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, [open]);

  const buy = async (pack) => {
    setBuying(pack.id);
    setError('');
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error('Could not load Razorpay checkout.');

      const { data: order } = await axios.post(
        `${API_URL}/api/users/credits/purchase/create-order`,
        { pack_id: pack.id },
        { withCredentials: true }
      );

      await new Promise((resolve, reject) => {
        const options = {
          key: order.razorpay_key_id,
          amount: order.amount_paise,
          currency: order.currency || 'INR',
          name: 'MAJA Creations',
          description: `${order.pack_label} · ${order.credits} credits`,
          order_id: order.order_id,
          prefill: {
            name: order.user_name || user?.name || '',
            email: order.user_email || user?.email || '',
            contact: order.user_phone || user?.phone || '',
          },
          notes: { pack_id: pack.id, kind: 'user_credit_pack' },
          theme: { color: '#D4AF37' },
          method: { upi: true, card: true, netbanking: true, wallet: true },
          handler: async (rzp) => {
            try {
              await axios.post(
                `${API_URL}/api/users/credits/purchase/verify`,
                {
                  razorpay_order_id: rzp.razorpay_order_id,
                  razorpay_payment_id: rzp.razorpay_payment_id,
                  razorpay_signature: rzp.razorpay_signature,
                },
                { withCredentials: true }
              );
              onPurchased?.();
              resolve();
            } catch (e) {
              reject(new Error(e?.response?.data?.detail || 'Verification failed'));
            }
          },
          modal: { ondismiss: () => reject(new Error('Checkout cancelled')) },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
        rzp.open();
      });

      onClose?.();
    } catch (e) {
      setError(e?.message || 'Could not start checkout.');
    } finally {
      setBuying(null);
    }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-8"
        style={{ background: 'rgba(8,5,3,0.82)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
        data-testid="public-credits-modal"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="lux-glass w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7 md:p-9 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full grid place-items-center" style={{ border: '1px solid var(--lux-border)', color: 'rgba(255,248,220,0.7)' }} data-testid="public-credits-close">
            <XIcon className="w-4 h-4" />
          </button>
          <span className="lux-eyebrow block mb-2">◆ Credit packs</span>
          <h2 className="font-display text-3xl mb-1" style={{ color: '#FFF8DC' }}>
            Buy <span className="text-gold italic font-script">credits</span>
          </h2>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,248,220,0.6)' }}>
            Use credits to unlock premium designs, gallery downloads and AI photo matching. Account: <span className="text-gold">{user?.email || '—'}</span> · Current balance: <strong className="text-gold">{user?.credits ?? 0}</strong>
          </p>

          {loading ? (
            <div className="grid place-items-center py-10">
              <Sparkles className="w-5 h-5 animate-pulse" style={{ color: '#D4AF37' }} />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-lg" style={{ background: 'rgba(255,248,220,0.03)', border: '1px solid var(--lux-border)' }} data-testid="public-credits-empty">
              <Coins className="w-9 h-9 mx-auto mb-3" style={{ color: '#D4AF37' }} />
              <p className="text-sm" style={{ color: 'rgba(255,248,220,0.7)' }}>
                No public credit packs yet. The studio is preparing them — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="public-credits-list">
              {packs.map((p) => (
                <div key={p.id} className="lux-glass p-5 relative" style={p.badge ? { border: '1px solid rgba(212,175,55,0.55)' } : {}}>
                  {p.badge && (
                    <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[9px] tracking-[0.25em] uppercase"
                      style={{ background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#16110C', fontFamily: 'DM Sans, sans-serif' }}>
                      {p.badge}
                    </div>
                  )}
                  <div className="font-display text-xl" style={{ color: '#FFF8DC' }}>{p.label}</div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <IndianRupee className="w-4 h-4 text-gold" />
                    <span className="font-display text-3xl text-gold leading-none">{p.price_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs tracking-[0.25em] uppercase mt-1" style={{ color: 'rgba(255,248,220,0.55)' }}>
                    = {p.credits.toLocaleString('en-IN')} credits
                  </div>
                  {p.design_id && (
                    <div className="text-[10px] tracking-[0.25em] uppercase mt-2 px-2 py-1 rounded-full inline-block" style={{ background: 'rgba(255,248,220,0.04)', border: '1px solid var(--lux-border)', color: 'rgba(255,248,220,0.7)' }}>
                      For {p.design_id.replace(/_/g, ' ')}
                    </div>
                  )}
                  {p.description && (
                    <p className="text-xs italic mt-3" style={{ color: 'rgba(255,248,220,0.7)' }}>{p.description}</p>
                  )}
                  <button
                    onClick={() => buy(p)}
                    disabled={buying === p.id}
                    className="lux-btn w-full justify-center mt-4"
                    data-testid={`public-credits-buy-${p.id}`}
                  >
                    {buying === p.id ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Check className="w-4 h-4" />}
                    {buying === p.id ? 'Opening checkout…' : 'Buy now'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-5 px-3 py-2 rounded-md text-xs"
              style={{ background: 'rgba(139,0,0,0.18)', border: '1px solid rgba(139,0,0,0.5)', color: '#FFD7C9' }}>
              {error}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout, refresh } = useUserAuth();
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  const openBuyCredits = () => {
    if (!user) { setAuthModal({ open: true, mode: 'signup' }); return; }
    setShowCredits(true);
  };

  return (
    <div className="luxe relative" style={{ minHeight: '100vh', overflow: 'visible' }} data-testid="landing-page">
      <Nav
        onLogin={() => navigate('/admin/login')}
        user={user}
        onOpenAuth={() => setAuthModal({ open: true, mode: 'login' })}
        onLogout={logout}
        onBuyCredits={openBuyCredits}
        onUserDashboard={() => navigate('/user/dashboard')}
      />
      <Hero onLogin={() => navigate('/admin/login')} />
      <Themes navigate={navigate} />
      <Stats />
      <InvitationOptions />
      <Features />
      <Story />
      <Pricing />
      <CTA onLogin={() => navigate('/admin/login')} />
      <Footer onSuperAdmin={() => navigate('/super-admin/login')} />

      <UserAuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, open: false })}
      />

      <PublicCreditsModal open={showCredits} onClose={() => setShowCredits(false)} user={user} onPurchased={() => { refresh?.(); }} />
    </div>
  );
};

export default LandingPage;
