import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Save, ExternalLink, Sparkles, Check,
  Palette as PaletteIcon, Calendar, MapPin, Music, ToggleLeft, Gift, BedDouble,
} from 'lucide-react';
import LuxuryShell from '@/components/luxury/LuxuryShell';
import MandalaLoader from '@/components/luxury/MandalaLoader';
import AIStoryComposer from '@/components/luxury/AIStoryComposer';
import FeatureFlagsPanel from '@/components/luxury/FeatureFlagsPanel';
import PhotoUploadField from '@/components/luxury/PhotoUploadField';
import MusicPresetPicker from '@/components/luxury/MusicPresetPicker';
import ThemePreviewModal from '@/components/luxury/ThemePreviewModal';
import ThemeDesignWizard from '@/components/luxury/ThemeDesignWizard';
import GuestRoomsEditor from '@/components/luxury/GuestRoomsEditor';
import PreWeddingLinksEditor from '@/components/luxury/PreWeddingLinksEditor';
import GalleryPrivacyEditor, { validatePrivacy } from '@/components/luxury/GalleryPrivacyEditor';
import { getAllThemes, getThemeById } from '@/themes/masterThemes';
import { useAuth } from '@/context/AuthContext';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STEPS = [
  { id: 'couple',  label: 'Couple',   icon: Sparkles },
  { id: 'theme',   label: 'Theme',    icon: PaletteIcon },
  { id: 'story',   label: 'Story',    icon: Sparkles },
  { id: 'venue',   label: 'Venue',    icon: MapPin },
  { id: 'media',   label: 'Media',    icon: Music },
  { id: 'stay',    label: 'Stay & Video', icon: BedDouble },
  { id: 'gifts',   label: 'Gifts',    icon: Gift },
  { id: 'flags',   label: 'Features', icon: ToggleLeft },
  { id: 'publish', label: 'Publish',  icon: Check },
];

const DEFAULT_FORM = {
  bride_name: '', groom_name: '', wedding_date: '', wedding_time: '',
  design_theme: 'royal_mughal',
  design_id: '',                 // specific design within (theme, event)
  primary_event: 'Marriage',     // auto-set from theme wizard event pick
  story: '',
  venue: '', venue_address: '',
  venue_google_map_link: '',
  // Parking (optional, photographer-toggleable)
  parking: {
    enabled: false,
    text: '',
    google_map_link: '',
  },
  background_music_url: '',
  events: [],
  feature_flags: {
    show_rsvp: true,
    show_wishes: true,
    show_live_gallery: false,
    show_countdown: true,
    show_music: true,
    show_ai_story: true,
    show_digital_shagun: false,
    show_translations: false,
  },
  language: 'English',
  // List of additional languages the invitation should be translatable into.
  // The "main language" sits in `language` and is the one guests first see.
  languages: [],
  // Publish expiry tier (key from credit_durations admin config; days resolved server-side)
  expiry_tier: '6_months',
  passcode: '',
  is_published: false,
  // Photos
  bride_photo_url: '',
  groom_photo_url: '',
  couple_photo_url: '',
  // Bride/Groom mini-bios shown on the public invitation
  bride_about: '',
  groom_about: '',
  // QR / invitation background customization
  use_couple_photo_as_qr_bg: true,
  use_couple_photo_as_invitation_bg: true,
  qr_bg_source: 'couple',          // 'couple' | 'bride' | 'groom' | 'custom'
  invitation_bg_source: 'couple',  // 'couple' | 'bride' | 'groom' | 'custom'
  qr_background_photo_url: '',
  invitation_background_photo_url: '',
  // Gifts & Digital Shagun
  shagun: {
    enabled: false,
    upi_id: '',
    payee_name: '',
    gpay_handle: '',
    phonepe_handle: '',
    paytm_handle: '',
    blessing_message: 'Your blessings mean more than any gift.',
    suggested_amounts: [501, 1100, 2100, 5100, 11000],
  },
  gifts: {
    enabled: false,
    show_disabled_note: true,
    headline: 'With love, not gifts',
    message: 'Your presence at our wedding is the most precious gift we could ask for.',
  },
  // Find My Room — guest accommodation directory (publicly searchable by name)
  guest_rooms: [],
  // Pre-wedding shoot links (Google Drive / YouTube / Vimeo)
  pre_wedding_links: [],
  // Phase 1C — RSVP form toggles
  rsvp_settings: {
    dietary_enabled: false,
    dietary_show_veg: true,
    dietary_show_nonveg: true,
    dietary_show_vegan: true,
    dietary_show_jain: true,
    allergies_enabled: false,
    plus_one_enabled: false,
    kids_enabled: false,
  },
  // Phase 1H — Honeymoon fund (UPI / QR display only)
  honeymoon_fund: {
    enabled: false,
    title: 'Honeymoon Fund',
    message: 'If you wish to bless our new beginnings, you may contribute below.',
    upi_id: '',
    payee_name: '',
    qr_image_url: '',
    show_progress: false,
    goal_amount: '',
    raised_amount: 0,
  },
  // Photo Privacy Settings (saved separately via /admin/profiles/{id}/gallery/privacy)
  gallery_privacy: null,
};

const LuxuryProfileForm = () => {
  const navigate = useNavigate();
  const { profileId, weddingId } = useParams();
  const [searchParams] = useSearchParams();
  const onBehalfOf = searchParams.get('on_behalf_of'); // super-admin impersonation
  const id = profileId || weddingId || null;
  const { admin, loading: authLoading } = useAuth();
  const isNew = !id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [previewTheme, setPreviewTheme] = useState(null); // theme preview modal

  useEffect(() => {
    if (authLoading) return; // wait for auth to hydrate
    if (!admin) { navigate('/admin/login'); return; }
    if (!isNew) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, authLoading]);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/profiles/${id}`);
      const d = res.data || {};
      // Read MAJA-extended fields stored under custom_text._maja
      const maja = (d.custom_text && d.custom_text._maja) || {};
      let extendedEvents = [];
      try { extendedEvents = maja.events_extended ? JSON.parse(maja.events_extended) : []; } catch {}

      // Load gifts + shagun + privacy in parallel (best-effort; ignore failures)
      let shagunData = {}; let giftsData = {}; let privacyData = null;
      try {
        const [sg, gf, pv] = await Promise.all([
          axios.get(`${API_URL}/api/admin/profiles/${id}/shagun`).catch(() => ({ data: {} })),
          axios.get(`${API_URL}/api/admin/profiles/${id}/gifts`).catch(() => ({ data: {} })),
          axios.get(`${API_URL}/api/admin/profiles/${id}/gallery/privacy`).catch(() => ({ data: null })),
        ]);
        shagunData = sg.data || {};
        giftsData  = gf.data || {};
        privacyData = pv.data || null;
      } catch (_) {}

      setForm({
        ...DEFAULT_FORM,
        bride_name: d.bride_name || '',
        groom_name: d.groom_name || '',
        wedding_date: d.event_date ? new Date(d.event_date).toISOString().slice(0, 10) : '',
        design_theme: d.design_id || d.design_theme || 'royal_mughal',
        venue: d.venue || '',
        venue_address: d.city || d.venue_address || '',
        story: d.love_story || d.story || '',
        background_music_url: d.background_music?.url || '',
        language: Array.isArray(d.language) ? (d.language[0] || 'English').replace(/^\w/, (c) => c.toUpperCase()) : (d.language || 'English'),
        events: extendedEvents.length > 0
          ? extendedEvents.map((e) => ({ ...e, visible: e.visible !== false }))
          : (d.events || []).map((e) => ({
          id: e.id || e.event_id, event_type: e.event_type || 'Wedding', title: e.title || e.name || '',
          event_date: e.event_date || e.date || '',
          start_time: e.start_time || e.wedding_time || '',
          venue: e.venue || e.venue_name || '',
          venue_address: e.venue_address || '',
          description: e.description || '',
          google_map_link: e.google_map_link || e.map_link || '',
          dress_code: e.dress_code || '',
          hero_photo_url: e.hero_photo_url || '',
          visible: e.visible !== false,
        })),
        feature_flags: { ...DEFAULT_FORM.feature_flags, ...(d.sections_enabled || {}) },
        passcode: d.passcode || '',
        // Photos + extras (from custom_text._maja or top-level)
        bride_photo_url:        maja.bride_photo_url        || d.bride_photo_url        || '',
        groom_photo_url:        maja.groom_photo_url        || d.groom_photo_url        || '',
        couple_photo_url:       maja.couple_photo_url       || d.couple_photo_url       || '',
        bride_about:            d.bride_about               || maja.bride_about         || '',
        groom_about:            d.groom_about               || maja.groom_about         || '',
        // QR / invitation background customization
        use_couple_photo_as_qr_bg:         d.use_couple_photo_as_qr_bg         !== false,
        use_couple_photo_as_invitation_bg: d.use_couple_photo_as_invitation_bg !== false,
        qr_bg_source:         d.qr_bg_source         || maja.qr_bg_source         || (d.use_couple_photo_as_qr_bg         !== false ? 'couple' : 'custom'),
        invitation_bg_source: d.invitation_bg_source || maja.invitation_bg_source || (d.use_couple_photo_as_invitation_bg !== false ? 'couple' : 'custom'),
        qr_background_photo_url:           maja.qr_background_photo_url        || '',
        invitation_background_photo_url:   maja.invitation_background_photo_url|| '',
        venue_google_map_link:  maja.venue_google_map_link  || d.map_settings?.map_link || '',
        parking: {
          enabled: !!(maja.parking?.enabled || d.parking?.enabled),
          text: maja.parking?.text || d.parking?.text || '',
          google_map_link: maja.parking?.google_map_link || d.parking?.google_map_link || '',
        },
        languages: Array.isArray(maja.languages) ? maja.languages : (Array.isArray(d.languages) ? d.languages : []),
        expiry_tier: maja.expiry_tier || d.expiry_tier || '6_months',
        design_id:    maja.design_id    || d.design_id_specific || '',
        primary_event: maja.primary_event || d.primary_event || 'Marriage',
        shagun: { ...DEFAULT_FORM.shagun, ...shagunData },
        gifts:  { ...DEFAULT_FORM.gifts,  ...giftsData },
        guest_rooms: Array.isArray(d.guest_rooms) ? d.guest_rooms : [],
        pre_wedding_links: Array.isArray(d.pre_wedding_links) ? d.pre_wedding_links : [],
        rsvp_settings: { ...DEFAULT_FORM.rsvp_settings, ...(d.rsvp_settings || {}) },
        honeymoon_fund: { ...DEFAULT_FORM.honeymoon_fund, ...(d.honeymoon_fund || {}) },
        gallery_privacy: privacyData ? { ...privacyData, code: '', confirm_code: '' } : null,
      });
      setShareLink(d.share_link || d.slug || '');
      setPublished(!!d.is_enabled || !!d.is_published);
    } catch (e) { setError(e.response?.data?.detail || 'Failed to load wedding.'); }
    finally { setLoading(false); }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setFlag = (k, v) => setForm((f) => ({ ...f, feature_flags: { ...f.feature_flags, [k]: v } }));
  const setShagun = (k, v) => setForm((f) => ({ ...f, shagun: { ...f.shagun, [k]: v } }));
  const setGifts  = (k, v) => setForm((f) => ({ ...f, gifts:  { ...f.gifts,  [k]: v } }));
  const setRsvpSetting = (k, v) => setForm((f) => ({ ...f, rsvp_settings: { ...f.rsvp_settings, [k]: v } }));
  const setHoneymoon   = (k, v) => setForm((f) => ({ ...f, honeymoon_fund: { ...f.honeymoon_fund, [k]: v } }));

  const save = async (opts = {}) => {
    setSaving(true); setError('');
    // Privacy validation first
    if (form.gallery_privacy?.enabled) {
      const pvErr = validatePrivacy(form.gallery_privacy);
      if (pvErr) {
        setError(pvErr);
        setSaving(false);
        return;
      }
    }
    try {
      // Resolve the actual URL based on the chosen source (couple/bride/groom/custom)
      const qrBgSrc = form.qr_bg_source || (form.use_couple_photo_as_qr_bg ? 'couple' : 'custom');
      const invBgSrc = form.invitation_bg_source || (form.use_couple_photo_as_invitation_bg ? 'couple' : 'custom');
      const resolveBgUrl = (src) => ({
        couple: form.couple_photo_url || '',
        bride:  form.bride_photo_url  || '',
        groom:  form.groom_photo_url  || '',
      }[src] || '');
      const qrBgResolved  = qrBgSrc === 'custom' ? (form.qr_background_photo_url || '') : resolveBgUrl(qrBgSrc);
      const invBgResolved = invBgSrc === 'custom' ? (form.invitation_background_photo_url || '') : resolveBgUrl(invBgSrc);

      const body = {
        bride_name: form.bride_name,
        groom_name: form.groom_name,
        event_type: 'marriage',
        event_date: form.wedding_date ? new Date(form.wedding_date).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        venue:      form.venue || 'TBA',
        city:       form.venue_address || '',
        design_id:  form.design_theme || 'royal_mughal',
        language:   [(form.language || 'English').toLowerCase()],
        enabled_languages: ([form.language, ...(form.languages || [])]
          .filter(Boolean)
          .map((l) => String(l).toLowerCase())),
        love_story: form.story || '',
        events:     [],   // strict per-event validation skipped; we persist extended events under custom_text._maja
        background_music: form.background_music_url ? { enabled: true, url: form.background_music_url, autoplay: false } : { enabled: false, url: '', autoplay: false },
        sections_enabled: form.feature_flags || {},
        map_settings: form.venue_google_map_link ? { embed_enabled: true, map_link: form.venue_google_map_link } : { embed_enabled: false },
        link_expiry_type: 'permanent',
        // Find My Room + Pre-wedding shoot links
        guest_rooms: (form.guest_rooms || []).filter((r) => (r.guest_name || '').trim()).map((r) => ({
          id: r.id && !String(r.id).startsWith('tmp-') ? r.id : undefined,
          guest_name: (r.guest_name || '').trim(),
          phone: r.phone || null,
          room_number: r.room_number || null,
          building: r.building || null,
          floor: r.floor || null,
          address: r.address || null,
          map_link: r.map_link || null,
          check_in: r.check_in || null,
          check_out: r.check_out || null,
          notes: r.notes || null,
        })),
        pre_wedding_links: (form.pre_wedding_links || []).filter((l) => (l.url || '').trim()).map((l) => ({
          id: l.id && !String(l.id).startsWith('tmp-') ? l.id : undefined,
          label: (l.label || 'Pre-wedding').trim(),
          url: (l.url || '').trim(),
          kind: l.kind || 'auto',
        })),
        // QR / invitation background settings
        use_couple_photo_as_qr_bg: qrBgSrc === 'couple',
        use_couple_photo_as_invitation_bg: invBgSrc === 'couple',
        qr_bg_source: qrBgSrc,
        invitation_bg_source: invBgSrc,
        // Bride/groom/couple photos & bios (top-level fields)
        bride_photo_url: form.bride_photo_url || '',
        groom_photo_url: form.groom_photo_url || '',
        couple_photo_url: form.couple_photo_url || '',
        bride_about: form.bride_about || '',
        groom_about: form.groom_about || '',
        // Phase 1C — RSVP toggles
        rsvp_settings: { ...form.rsvp_settings },
        // Phase 1H — Honeymoon fund
        honeymoon_fund: {
          ...form.honeymoon_fund,
          goal_amount: form.honeymoon_fund.goal_amount === '' || form.honeymoon_fund.goal_amount === null
            ? null
            : parseInt(form.honeymoon_fund.goal_amount, 10) || null,
          raised_amount: parseInt(form.honeymoon_fund.raised_amount, 10) || 0,
        },
        // Photos + per-event details persisted via custom_text (free-form dict)
        custom_text: {
          _maja: {
            bride_photo_url: form.bride_photo_url || '',
            groom_photo_url: form.groom_photo_url || '',
            couple_photo_url: form.couple_photo_url || '',
            qr_background_photo_url: qrBgResolved,
            invitation_background_photo_url: invBgResolved,
            qr_bg_source: qrBgSrc,
            invitation_bg_source: invBgSrc,
            venue_google_map_link: form.venue_google_map_link || '',
            events_extended: JSON.stringify(form.events || []),
            parking: form.parking || {},
            languages: form.languages || [],
            expiry_tier: form.expiry_tier || '6_months',
            design_id: form.design_id || '',
            primary_event: form.primary_event || 'Marriage',
          },
        },
      };
      let res;
      if (isNew) {
        const createUrl = onBehalfOf
          ? `${API_URL}/api/admin/profiles?on_behalf_of=${encodeURIComponent(onBehalfOf)}`
          : `${API_URL}/api/admin/profiles`;
        res = await axios.post(createUrl, body);
      } else {
        res = await axios.put(`${API_URL}/api/admin/profiles/${id}`, body);
      }
      setShareLink(res.data.share_link || res.data.slug || '');

      // Save Digital Shagun + Gifts settings (best-effort, after profile id exists)
      const profileId = res.data.id || id;
      if (profileId) {
        try {
          await axios.put(`${API_URL}/api/admin/profiles/${profileId}/shagun`, form.shagun);
        } catch (_) { /* non-fatal */ }
        try {
          await axios.put(`${API_URL}/api/admin/profiles/${profileId}/gifts`, form.gifts);
        } catch (_) { /* non-fatal */ }
        // Save Photo Privacy settings (only when the editor is initialised)
        if (form.gallery_privacy) {
          try {
            const pv = form.gallery_privacy;
            const payload = {
              enabled: !!pv.enabled,
              public_highlights_enabled: !!pv.public_highlights_enabled,
              private_full_gallery_enabled: !!pv.private_full_gallery_enabled,
              ai_face_match_enabled: !!pv.ai_face_match_enabled,
              allow_downloads: !!pv.allow_downloads,
              allow_share: !!pv.allow_share,
              remember_days: pv.remember_days || 30,
              expires_at: pv.expires_at || null,
              ...(pv.code ? { code: pv.code, confirm_code: pv.confirm_code } : {}),
            };
            const r = await axios.put(`${API_URL}/api/admin/profiles/${profileId}/gallery/privacy`, payload);
            // refresh has_password flag so subsequent saves don't demand a new code
            setForm((f) => ({ ...f, gallery_privacy: { ...(r.data || {}), code: '', confirm_code: '' } }));
          } catch (_) { /* non-fatal */ }
        }
        // Regenerate QR codes so the couple-photo background change takes effect immediately
        try {
          await axios.post(`${API_URL}/api/admin/profiles/${profileId}/regenerate-all-qrs`);
        } catch (_) { /* non-fatal */ }
      }

      if (opts.publish) {
        try {
          const pubRes = await axios.put(`${API_URL}/api/admin/profiles/${res.data.id || id}/enable`);
          setPublished(true);
          setShareLink(pubRes.data.share_link || res.data.share_link || res.data.slug || '');
        } catch (_) { setPublished(true); }
      }
      if (isNew && res.data.id) {
        const suffix = onBehalfOf ? `?on_behalf_of=${encodeURIComponent(onBehalfOf)}` : '';
        navigate(`/admin/profile/${res.data.id}/edit${suffix}`, { replace: true });
      }
      return res.data;
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((x) => `${x.loc?.join('.')}: ${x.msg}`).join('; ') : (detail || 'Save failed.');
      setError(msg);
      return null;
    } finally { setSaving(false); }
  };

  const next = async () => {
    if (step < STEPS.length - 1) {
      // auto-save quietly between steps when editing existing
      if (!isNew && form.bride_name && form.groom_name) await save();
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prev = () => { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) {
    return <LuxuryShell title="Loading"><div className="grid place-items-center py-32"><MandalaLoader /></div></LuxuryShell>;
  }

  return (
    <LuxuryShell
      eyebrow={onBehalfOf ? '◆ Wedding Editor · On behalf of photographer' : '◆ Wedding Editor'}
      title={isNew ? 'New Wedding' : `${form.bride_name} & ${form.groom_name}`}
      showBack
      onBack={() => navigate(onBehalfOf ? `/super-admin/photographers/${onBehalfOf}` : '/admin/dashboard')}
      actions={
        <button onClick={() => save()} disabled={saving} className="lux-btn lux-btn-ghost text-xs" data-testid="save-btn">
          {saving ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
      }
      testid="luxury-profile-form"
    >
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
        {onBehalfOf && (
          <div className="mb-6 px-5 py-4 rounded-xl flex items-start gap-3 text-sm"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)', color: '#FFF8DC' }}
            data-testid="on-behalf-banner"
          >
            <Sparkles className="w-4 h-4 mt-0.5 text-gold shrink-0" />
            <div>
              <div className="font-medium" style={{ color: '#D4AF37' }}>Creating invitation on behalf of a photographer</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,248,220,0.7)' }}>
                This invitation will be saved under photographer ID <span className="font-mono">{onBehalfOf.slice(0, 8)}…</span> and appear in their dashboard.
              </div>
            </div>
          </div>
        )}        {/* Stepper */}
        <div className="lux-glass p-4 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <button key={s.id} onClick={() => setStep(i)} data-testid={`step-${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-full transition-all whitespace-nowrap"
                  style={active
                    ? { background: '#D4AF37', color: '#16110C', fontWeight: 600 }
                    : { background: 'transparent', color: done ? '#D4AF37' : 'rgba(255,248,220,0.65)', border: '1px solid var(--lux-border)' }
                  }>
                  <span className="text-[10px] tracking-[0.2em] uppercase">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs uppercase tracking-widest">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(139,0,0,0.18)', border: '1px solid rgba(139,0,0,0.5)', color: '#FFD7C9' }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={STEPS[step].id}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lux-glass p-8 md:p-10"
          >
            {STEPS[step].id === 'couple' && (
              <Step title="The Couple" subtitle="Names will appear in the hero of every invitation. (Customer-visible: Hero cover, monogram, footer)">
                <Row>
                  <Field label="Bride Name"><Input value={form.bride_name} onChange={(v) => setField('bride_name', v)} testid="field-bride" /></Field>
                  <Field label="Groom Name"><Input value={form.groom_name} onChange={(v) => setField('groom_name', v)} testid="field-groom" /></Field>
                </Row>
                <Row>
                  <Field label="Wedding Date"><Input type="date" value={form.wedding_date?.slice(0, 10) || ''} onChange={(v) => setField('wedding_date', v)} testid="field-date" /></Field>
                  <Field label="Wedding Time"><Input type="time" value={form.wedding_time} onChange={(v) => setField('wedding_time', v)} testid="field-time" /></Field>
                </Row>
                <Field label="Main Language (default language guests see)">
                  <Select value={form.language} onChange={(v) => setField('language', v)} options={['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi', 'Hinglish', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam']} testid="field-language" />
                </Field>
                <p className="text-[11px] -mt-2" style={{ color: 'rgba(255,248,220,0.5)' }}>
                  Tip: This is the <strong className="text-gold">main</strong> language — the one guests will see when they first open your link. They can switch languages from the link header if Multi-language is enabled in Features.
                </p>

                {/* Photos */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                  <div className="lux-eyebrow mb-3">◆ Photos · Hero & 3D animation</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PhotoUploadField label="Bride Solo"  value={form.bride_photo_url}  onChange={(v) => setField('bride_photo_url',  v)} profileId={id} testid="upload-bride" />
                    <PhotoUploadField label="Groom Solo"  value={form.groom_photo_url}  onChange={(v) => setField('groom_photo_url',  v)} profileId={id} testid="upload-couple-solo" />
                    <PhotoUploadField label="Couple"      value={form.couple_photo_url} onChange={(v) => setField('couple_photo_url', v)} profileId={id} testid="upload-couple" />
                  </div>

                  {/* Bride & Groom mini-bios — shown next to their photos on the public invitation */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="About the Bride">
                      <textarea
                        value={form.bride_about || ''}
                        onChange={(e) => setField('bride_about', e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="A short note about the bride — her work, hobbies, the way she lights up a room…"
                        className="w-full px-3 py-2.5 rounded-md text-[14px] outline-none resize-y"
                        style={{ background: 'rgba(255,248,220,0.04)', color: '#FFF8DC', border: '1px solid var(--lux-border)', fontFamily: '"Cormorant Garamond", serif' }}
                        data-testid="field-bride-about"
                      />
                    </Field>
                    <Field label="About the Groom">
                      <textarea
                        value={form.groom_about || ''}
                        onChange={(e) => setField('groom_about', e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="A short note about the groom — his passions, what makes him laugh, why he chose her…"
                        className="w-full px-3 py-2.5 rounded-md text-[14px] outline-none resize-y"
                        style={{ background: 'rgba(255,248,220,0.04)', color: '#FFF8DC', border: '1px solid var(--lux-border)', fontFamily: '"Cormorant Garamond", serif' }}
                        data-testid="field-groom-about"
                      />
                    </Field>
                  </div>

                  {/* QR + invitation background customization */}
                  <div className="mt-8 lux-glass p-5" data-testid="qr-bg-card">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}>
                        <span style={{ color: '#D4AF37', fontSize: '0.9rem' }}>◆</span>
                      </div>
                      <div>
                        <h3 className="font-display text-lg leading-tight" style={{ color: '#FFF8DC' }}>
                          QR code & invitation background
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,248,220,0.6)' }}>
                          By default we use the <strong className="text-gold">couple photo</strong> above as the artwork behind every QR code <em>and</em> behind the invitation page. Turn either off to pick a different image for that surface.
                        </p>
                      </div>
                    </div>

                    {/* QR background — choose source */}
                    <div className="rounded-lg p-4 mb-3" style={{ background: 'rgba(255,248,220,0.03)', border: '1px solid var(--lux-border)' }}>
                      <div className="mb-3">
                        <span className="text-sm" style={{ color: '#FFF8DC' }}>
                          <strong className="text-gold">QR code background</strong> — pick which photo to use
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { key: 'couple', label: 'Couple' },
                          { key: 'bride',  label: 'Bride'  },
                          { key: 'groom',  label: 'Groom'  },
                          { key: 'custom', label: 'Custom' },
                        ].map((opt) => {
                          const active = (form.qr_bg_source || 'couple') === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setField('qr_bg_source', opt.key);
                                setField('use_couple_photo_as_qr_bg', opt.key === 'couple');
                              }}
                              className="px-2 py-2 rounded text-xs tracking-[0.15em] uppercase transition-all"
                              style={{
                                background: active ? 'rgba(212,175,55,0.18)' : 'rgba(255,248,220,0.04)',
                                border: `1px solid ${active ? 'rgba(212,175,55,0.7)' : 'rgba(255,248,220,0.15)'}`,
                                color: active ? '#E8C766' : 'rgba(255,248,220,0.7)',
                              }}
                              data-testid={`qr-bg-source-${opt.key}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {form.qr_bg_source === 'custom' && (
                        <div className="mt-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>
                            Custom QR background image
                          </p>
                          <PhotoUploadField
                            label="QR Background"
                            value={form.qr_background_photo_url}
                            onChange={(v) => setField('qr_background_photo_url', v)}
                            profileId={id}
                            testid="upload-qr-background"
                          />
                        </div>
                      )}
                    </div>

                    {/* Invitation page background — choose source */}
                    <div className="rounded-lg p-4" style={{ background: 'rgba(255,248,220,0.03)', border: '1px solid var(--lux-border)' }}>
                      <div className="mb-3">
                        <span className="text-sm" style={{ color: '#FFF8DC' }}>
                          <strong className="text-gold">Invitation page background</strong> — pick which photo to use
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { key: 'couple', label: 'Couple' },
                          { key: 'bride',  label: 'Bride'  },
                          { key: 'groom',  label: 'Groom'  },
                          { key: 'custom', label: 'Custom' },
                        ].map((opt) => {
                          const active = (form.invitation_bg_source || 'couple') === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setField('invitation_bg_source', opt.key);
                                setField('use_couple_photo_as_invitation_bg', opt.key === 'couple');
                              }}
                              className="px-2 py-2 rounded text-xs tracking-[0.15em] uppercase transition-all"
                              style={{
                                background: active ? 'rgba(212,175,55,0.18)' : 'rgba(255,248,220,0.04)',
                                border: `1px solid ${active ? 'rgba(212,175,55,0.7)' : 'rgba(255,248,220,0.15)'}`,
                                color: active ? '#E8C766' : 'rgba(255,248,220,0.7)',
                              }}
                              data-testid={`invite-bg-source-${opt.key}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {form.invitation_bg_source === 'custom' && (
                        <div className="mt-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>
                            Custom invitation page background image
                          </p>
                          <PhotoUploadField
                            label="Invitation Background"
                            value={form.invitation_background_photo_url}
                            onChange={(v) => setField('invitation_background_photo_url', v)}
                            profileId={id}
                            testid="upload-invitation-background"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {STEPS[step].id === 'theme' && (
              <Step title="Choose a Design" subtitle="Pick a theme, then a ceremony, then the exact design. Click Preview at any step to see the live invitation.">
                <ThemeDesignWizard
                  value={{
                    theme_id: form.design_theme,
                    event: form.primary_event,
                    design_id: form.design_id,
                  }}
                  onChange={(v) => {
                    if (v.theme_id) setField('design_theme', v.theme_id);
                    if (v.event) setField('primary_event', v.event);
                    if (v.design_id) setField('design_id', v.design_id);
                  }}
                  coupleData={{
                    bride_name: form.bride_name,
                    groom_name: form.groom_name,
                    wedding_date: form.wedding_date,
                    venue: form.venue,
                    story: form.story,
                    couple_photo_url: form.couple_photo_url,
                    bride_photo_url: form.bride_photo_url,
                    groom_photo_url: form.groom_photo_url,
                    background_music_url: form.background_music_url,
                  }}
                />
              </Step>
            )}

            {STEPS[step].id === 'story' && (
              <Step title="Your Love Story" subtitle="Where you met, how it began. Or let Claude write it. (Customer-visible: 'Our Story' section)">
                <div className="flex justify-end mb-3">
                  <button type="button" onClick={() => setAiOpen(true)} className="lux-btn lux-btn-ghost text-xs" data-testid="ai-compose-story">
                    <Sparkles className="w-3.5 h-3.5" /> AI Compose
                  </button>
                </div>
                <Field label="Story"><Textarea rows={8} value={form.story} onChange={(v) => setField('story', v)} testid="field-story" /></Field>
              </Step>
            )}

            {STEPS[step].id === 'venue' && (
              <Step title="The Venue" subtitle="Primary venue + Google Maps link for one-tap navigation. (Customer-visible: 'Venue' section + 'Open in Maps' button)">
                <Field label="Venue Name"><Input value={form.venue} onChange={(v) => setField('venue', v)} placeholder="The Leela Palace" testid="field-venue" /></Field>
                <Field label="Full Address"><Textarea rows={3} value={form.venue_address} onChange={(v) => setField('venue_address', v)} placeholder="Lake Pichola, Udaipur, Rajasthan 313001" testid="field-venue-address" /></Field>
                <Field label="Google Maps Link">
                  <Input
                    value={form.venue_google_map_link}
                    onChange={(v) => setField('venue_google_map_link', v)}
                    placeholder="https://maps.google.com/?q=The+Leela+Palace+Udaipur"
                    testid="field-venue-map"
                  />
                </Field>
                <p className="text-xs" style={{ color: 'rgba(255,248,220,0.5)' }}>
                  Open Google Maps → search the venue → tap "Share" → "Copy link" → paste here. Guests tap the "Open in Maps" button on the invitation to get instant turn-by-turn directions.
                </p>
                {form.venue_google_map_link && (
                  <a href={form.venue_google_map_link} target="_blank" rel="noreferrer"
                    className="lux-btn lux-btn-ghost text-xs inline-flex items-center gap-2 mt-2"
                    data-testid="venue-map-test-link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test this Maps link
                  </a>
                )}

                {/* Parking — optional, toggleable */}
                <div className="mt-6 lux-glass p-5" data-testid="parking-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="lux-eyebrow mb-1">◆ Parking Info <span className="text-[10px] opacity-60">(optional)</span></div>
                      <p className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                        When the parking is at a different spot than the venue, give your guests a clear note + map link.
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setField('parking', { ...form.parking, enabled: !form.parking?.enabled })}
                      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                      style={{ background: form.parking?.enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                      data-testid="parking-enabled-toggle">
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ background: '#FFF8DC', left: form.parking?.enabled ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>
                  {form.parking?.enabled && (
                    <div className="space-y-3">
                      <Field label="Parking instructions (shown above the Map link)">
                        <Textarea rows={3} value={form.parking?.text || ''}
                          onChange={(v) => setField('parking', { ...form.parking, text: v })}
                          testid="parking-text" />
                      </Field>
                      <Field label="Parking Google Maps Link (optional)">
                        <Input value={form.parking?.google_map_link || ''}
                          onChange={(v) => setField('parking', { ...form.parking, google_map_link: v })}
                          placeholder="https://maps.google.com/?q=Parking+Lot"
                          testid="parking-map-link" />
                      </Field>
                      <p className="text-xs" style={{ color: 'rgba(255,248,220,0.5)' }}>
                        Example: "You can park in the underground lot of XYZ Mandapam — entry from Gate 2." Add a Google Maps link if the spot is far from the venue.
                      </p>
                    </div>
                  )}
                </div>
              </Step>
            )}

            {STEPS[step].id === 'media' && (
              <Step title="Music" subtitle="Pick from 20 curated tracks or paste your own URL. (Customer-visible: persistent bottom-right ambient player)">
                <MusicPresetPicker
                  value={form.background_music_url}
                  onChange={(v) => setField('background_music_url', v)}
                />
              </Step>
            )}

            {STEPS[step].id === 'stay' && (
              <Step
                title="Stay & Pre-wedding"
                subtitle="Two cosy add-ons for your guests: a name-searchable room directory and your pre-wedding shoot film."
              >
                <div className="lux-glass p-5">
                  <div className="lux-eyebrow mb-2">◆ Pre-wedding Video / Drive Link</div>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,248,220,0.6)' }}>
                    Paste a Google Drive (recommended), YouTube, or Vimeo link. Drive files must be shared as
                    <span className="text-gold"> "Anyone with the link · Viewer"</span> so guests can play without signing in.
                  </p>
                  <PreWeddingLinksEditor
                    links={form.pre_wedding_links || []}
                    onChange={(links) => setField('pre_wedding_links', links)}
                  />
                </div>

                <div className="lux-glass p-5 mt-4">
                  <div className="lux-eyebrow mb-2">◆ Find My Room · Guest accommodation directory</div>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,248,220,0.6)' }}>
                    Add one row per guest (or family). Out-of-town guests will type their name on the invitation to
                    instantly see their room number, building, an embedded map, and check-in instructions.
                  </p>
                  <GuestRoomsEditor
                    rooms={form.guest_rooms || []}
                    onChange={(rooms) => setField('guest_rooms', rooms)}
                  />
                </div>

                <div className="lux-glass p-5 mt-4">
                  <div className="lux-eyebrow mb-2">◆ Photo Privacy · Gallery & AI Face Match access</div>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,248,220,0.6)' }}>
                    Protect the wedding gallery with an access code so the photos stay private even when the link or QR is shared.
                    Guests get a beautiful lock screen and can "Remember this device" so they only enter the code once.
                  </p>
                  <GalleryPrivacyEditor
                    value={form.gallery_privacy || { enabled: false }}
                    onChange={(v) => setField('gallery_privacy', v)}
                  />
                </div>
              </Step>
            )}

            {STEPS[step].id === 'gifts' && (
              <Step
                title="Gifts & Digital Shagun"
                subtitle={isNew
                  ? 'Save the draft once to enable Gifts & Shagun (they sync per invitation).'
                  : 'Configure how guests can offer blessings. UPI deep links — one tap, no fees.'}
              >
                {/* Digital Shagun */}
                <div className="lux-glass p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="lux-eyebrow mb-1">◆ Digital Shagun (UPI)</div>
                      <p className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                        Guests see suggested amounts and tap to pay via Google Pay / PhonePe / Paytm / any UPI app.
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setShagun('enabled', !form.shagun.enabled)}
                      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                      style={{ background: form.shagun.enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                      data-testid="shagun-enabled-toggle"
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ background: '#FFF8DC', left: form.shagun.enabled ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>

                  {form.shagun.enabled && (
                    <div className="space-y-3">
                      <Row>
                        <Field label="UPI ID (required)"><Input value={form.shagun.upi_id} onChange={(v) => setShagun('upi_id', v)} placeholder="yourname@okhdfcbank" testid="shagun-upi-id" /></Field>
                        <Field label="Payee Name"><Input value={form.shagun.payee_name} onChange={(v) => setShagun('payee_name', v)} placeholder={`${form.bride_name || 'Bride'} & ${form.groom_name || 'Groom'}`} testid="shagun-payee-name" /></Field>
                      </Row>
                      <Row>
                        <Field label="Google Pay handle (optional)"><Input value={form.shagun.gpay_handle} onChange={(v) => setShagun('gpay_handle', v)} placeholder="@okgpay" testid="shagun-gpay" /></Field>
                        <Field label="PhonePe handle (optional)"><Input value={form.shagun.phonepe_handle} onChange={(v) => setShagun('phonepe_handle', v)} placeholder="@ybl" testid="shagun-phonepe" /></Field>
                      </Row>
                      <Field label="Paytm handle (optional)"><Input value={form.shagun.paytm_handle} onChange={(v) => setShagun('paytm_handle', v)} placeholder="@paytm" testid="shagun-paytm" /></Field>
                      <Field label="Blessing Message"><Textarea rows={2} value={form.shagun.blessing_message} onChange={(v) => setShagun('blessing_message', v)} testid="shagun-message" /></Field>
                      <Field label="Suggested Amounts (₹, comma-separated)">
                        <Input
                          value={(form.shagun.suggested_amounts || []).join(', ')}
                          onChange={(v) => setShagun('suggested_amounts', v.split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => Number.isFinite(x) && x > 0))}
                          placeholder="501, 1100, 2100, 5100, 11000"
                          testid="shagun-amounts"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* Gift Registry */}
                <div className="lux-glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="lux-eyebrow mb-1">◆ Gift Registry</div>
                      <p className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                        Toggle ON to show gift suggestions. Toggle OFF for a polite "no gifts please" note.
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => setGifts('enabled', !form.gifts.enabled)}
                      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                      style={{ background: form.gifts.enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                      data-testid="gifts-enabled-toggle"
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ background: '#FFF8DC', left: form.gifts.enabled ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>

                  <Field label="Headline">
                    <Input
                      value={form.gifts.headline}
                      onChange={(v) => setGifts('headline', v)}
                      placeholder={form.gifts.enabled ? 'With grace, a few gift ideas' : 'With love, not gifts'}
                      testid="gifts-headline"
                    />
                  </Field>
                  <Field label="Message to Guests">
                    <Textarea
                      rows={3}
                      value={form.gifts.message}
                      onChange={(v) => setGifts('message', v)}
                      testid="gifts-message"
                    />
                  </Field>
                  {!form.gifts.enabled && (
                    <label className="flex items-center gap-2 mt-3 text-sm" style={{ color: 'rgba(255,248,220,0.75)' }}>
                      <input type="checkbox" checked={!!form.gifts.show_disabled_note}
                        onChange={(e) => setGifts('show_disabled_note', e.target.checked)}
                        data-testid="gifts-show-note" />
                      Still show a polite "no gifts" note on the invitation
                    </label>
                  )}
                  {!isNew && (
                    <p className="text-[11px] mt-3" style={{ color: 'rgba(255,248,220,0.5)' }}>
                      For detailed gift suggestions (items, links, presets), open the dedicated
                      {' '}<a href={`/admin/profile/${id}/gifts`} className="text-gold underline">Gift Registry editor</a>.
                    </p>
                  )}
                </div>

                {/* Phase 1H — Honeymoon Fund */}
                <div className="lux-glass p-5 mt-4" data-testid="admin-honeymoon-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="lux-eyebrow mb-1">◆ Honeymoon Fund</div>
                      <p className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                        Simple UPI / QR display for honeymoon contributions. No platform fees. You receive directly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHoneymoon('enabled', !form.honeymoon_fund.enabled)}
                      className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                      style={{ background: form.honeymoon_fund.enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                      data-testid="honeymoon-enabled-toggle"
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ background: '#FFF8DC', left: form.honeymoon_fund.enabled ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>

                  {form.honeymoon_fund.enabled && (
                    <div className="space-y-3">
                      <Row>
                        <Field label="Section Title">
                          <Input value={form.honeymoon_fund.title} onChange={(v) => setHoneymoon('title', v)} placeholder="Honeymoon Fund" testid="honeymoon-title" />
                        </Field>
                        <Field label="Payee Name (shown in UPI app)">
                          <Input value={form.honeymoon_fund.payee_name} onChange={(v) => setHoneymoon('payee_name', v)} placeholder={`${form.bride_name || 'Bride'} & ${form.groom_name || 'Groom'}`} testid="honeymoon-payee" />
                        </Field>
                      </Row>
                      <Field label="UPI ID (e.g. couple@okhdfcbank)">
                        <Input value={form.honeymoon_fund.upi_id} onChange={(v) => setHoneymoon('upi_id', v)} placeholder="yourname@okhdfcbank" testid="honeymoon-upi-id" />
                      </Field>
                      <Field label="QR Image URL (optional — host a custom QR, or upload via Media tab)">
                        <Input value={form.honeymoon_fund.qr_image_url} onChange={(v) => setHoneymoon('qr_image_url', v)} placeholder="https://… (leave blank to only show UPI ID)" testid="honeymoon-qr-url" />
                      </Field>
                      <Field label="Message to Guests">
                        <Textarea rows={2} value={form.honeymoon_fund.message} onChange={(v) => setHoneymoon('message', v)} testid="honeymoon-message" />
                      </Field>

                      <div className="pt-2 border-t" style={{ borderColor: 'rgba(212,175,55,0.18)' }}>
                        <label className="flex items-center gap-3 cursor-pointer mb-3" data-testid="honeymoon-progress-wrap">
                          <input
                            type="checkbox"
                            checked={!!form.honeymoon_fund.show_progress}
                            onChange={(e) => setHoneymoon('show_progress', e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: '#D4AF37' }}
                            data-testid="honeymoon-show-progress"
                          />
                          <span className="text-sm" style={{ color: '#FFF8DC' }}>Show a progress bar (optional)</span>
                        </label>
                        {form.honeymoon_fund.show_progress && (
                          <Row>
                            <Field label="Goal Amount (₹)">
                              <Input
                                type="number"
                                value={form.honeymoon_fund.goal_amount}
                                onChange={(v) => setHoneymoon('goal_amount', v)}
                                placeholder="100000"
                                testid="honeymoon-goal"
                              />
                            </Field>
                            <Field label="Raised So Far (₹) — update manually">
                              <Input
                                type="number"
                                value={form.honeymoon_fund.raised_amount}
                                onChange={(v) => setHoneymoon('raised_amount', v)}
                                placeholder="0"
                                testid="honeymoon-raised"
                              />
                            </Field>
                          </Row>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Phase 1C — RSVP Form Fields */}
                <div className="lux-glass p-5 mt-4" data-testid="admin-rsvp-settings-card">
                  <div className="lux-eyebrow mb-1">◆ RSVP Form Fields</div>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,248,220,0.55)' }}>
                    Choose which extra fields appear on the public RSVP form. Each toggle is independent.
                  </p>

                  <div className="space-y-3">
                    {/* Dietary */}
                    <div className="flex items-start justify-between gap-4 py-2 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: '#FFF8DC' }}>Dietary Preference</div>
                        <div className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>Guests pick: Veg / Non-veg / Vegan / Jain</div>
                      </div>
                      <button type="button"
                        onClick={() => setRsvpSetting('dietary_enabled', !form.rsvp_settings.dietary_enabled)}
                        className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                        style={{ background: form.rsvp_settings.dietary_enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                        data-testid="rsvp-dietary-toggle"
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                          style={{ background: '#FFF8DC', left: form.rsvp_settings.dietary_enabled ? 'calc(100% - 22px)' : '2px' }} />
                      </button>
                    </div>
                    {form.rsvp_settings.dietary_enabled && (
                      <div className="pl-4 grid grid-cols-2 gap-2 pb-3" data-testid="rsvp-dietary-options">
                        {[
                          { k: 'dietary_show_veg',    label: 'Vegetarian' },
                          { k: 'dietary_show_nonveg', label: 'Non-Vegetarian' },
                          { k: 'dietary_show_vegan',  label: 'Vegan' },
                          { k: 'dietary_show_jain',   label: 'Jain' },
                        ].map((o) => (
                          <label key={o.k} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'rgba(255,248,220,0.85)' }}>
                            <input
                              type="checkbox"
                              checked={!!form.rsvp_settings[o.k]}
                              onChange={(e) => setRsvpSetting(o.k, e.target.checked)}
                              style={{ width: 14, height: 14, accentColor: '#D4AF37' }}
                              data-testid={`rsvp-opt-${o.k}`}
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Allergies */}
                    <div className="flex items-start justify-between gap-4 py-2 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: '#FFF8DC' }}>Allergies Note</div>
                        <div className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>Free-text field, up to 250 characters</div>
                      </div>
                      <button type="button"
                        onClick={() => setRsvpSetting('allergies_enabled', !form.rsvp_settings.allergies_enabled)}
                        className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                        style={{ background: form.rsvp_settings.allergies_enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                        data-testid="rsvp-allergies-toggle"
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                          style={{ background: '#FFF8DC', left: form.rsvp_settings.allergies_enabled ? 'calc(100% - 22px)' : '2px' }} />
                      </button>
                    </div>

                    {/* Plus-one */}
                    <div className="flex items-start justify-between gap-4 py-2 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: '#FFF8DC' }}>Plus-One</div>
                        <div className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>Guest can indicate they're bringing a partner</div>
                      </div>
                      <button type="button"
                        onClick={() => setRsvpSetting('plus_one_enabled', !form.rsvp_settings.plus_one_enabled)}
                        className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                        style={{ background: form.rsvp_settings.plus_one_enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                        data-testid="rsvp-plusone-toggle"
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                          style={{ background: '#FFF8DC', left: form.rsvp_settings.plus_one_enabled ? 'calc(100% - 22px)' : '2px' }} />
                      </button>
                    </div>

                    {/* Kids */}
                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: '#FFF8DC' }}>Kids Attending</div>
                        <div className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>Number of kids the guest will bring</div>
                      </div>
                      <button type="button"
                        onClick={() => setRsvpSetting('kids_enabled', !form.rsvp_settings.kids_enabled)}
                        className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                        style={{ background: form.rsvp_settings.kids_enabled ? '#D4AF37' : 'rgba(255,255,255,0.15)' }}
                        data-testid="rsvp-kids-toggle"
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                          style={{ background: '#FFF8DC', left: form.rsvp_settings.kids_enabled ? 'calc(100% - 22px)' : '2px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {STEPS[step].id === 'flags' && (
              <Step title="Feature Flags" subtitle="Toggle individual capabilities for this invitation. Each feature shows its credit cost or 'Free'.">
                <FeatureFlagsPanel
                  flags={[
                    { key: 'show_rsvp',          label: 'RSVP',                description: 'Collect guest responses with attendance count.',              enabled: form.feature_flags.show_rsvp, free: true },
                    { key: 'show_wishes',        label: 'Guest Wishes',        description: 'Public guest book on the invitation.',                          enabled: form.feature_flags.show_wishes, free: true },
                    { key: 'show_countdown',     label: 'Countdown',           description: 'Live ticker until the wedding moment.',                         enabled: form.feature_flags.show_countdown, free: true },
                    { key: 'show_music',         label: 'Ambient Music',       description: 'Persistent background score with crossfade.',                   enabled: form.feature_flags.show_music, free: true },
                    { key: 'show_live_gallery',  label: 'Live Photo Gallery',  description: 'Stream the wedding photos in real-time.',                       enabled: form.feature_flags.show_live_gallery, creditCost: 3 },
                    { key: 'show_ai_story',      label: 'AI Story Composer',   description: 'Gemini-powered cinematic prose generation.',                    enabled: form.feature_flags.show_ai_story, creditCost: 1 },
                    { key: 'show_digital_shagun',label: 'Digital Shagun',      description: 'Accept gifts via UPI / QR / Razorpay.',                         enabled: form.feature_flags.show_digital_shagun, creditCost: 2 },
                    {
                      key: 'show_translations',  label: 'Multi-language',      description: 'Translate content to additional languages. Guests can switch from the link header.',
                      enabled: form.feature_flags.show_translations, creditCost: 2,
                      extra: (
                        <MultiLangPicker
                          mainLanguage={form.language}
                          languages={form.languages || []}
                          onChange={(langs) => setField('languages', langs)}
                          profileId={id}
                        />
                      ),
                    },
                  ]}
                  onChange={setFlag}
                />
              </Step>
            )}

            {STEPS[step].id === 'publish' && (
              <Step title="Publish" subtitle={published ? 'This wedding is live.' : 'Drafts are free. Publish consumes credits based on theme and expiry.'}>
                <div className="space-y-4">
                  <Field label="Privacy Passcode (optional)">
                    <Input value={form.passcode} onChange={(v) => setField('passcode', v)} placeholder="Leave blank for public invite" testid="field-passcode" />
                  </Field>

                  <ExpiryTierSelector
                    value={form.expiry_tier}
                    onChange={(v) => setField('expiry_tier', v)}
                  />

                  <div className="lux-glass p-6">
                    <div className="lux-eyebrow mb-2">◆ Publishing Cost</div>
                    <div className="font-display text-4xl text-gold mb-2">{getThemeById(form.design_theme).creditCost} credit{getThemeById(form.design_theme).creditCost > 1 ? 's' : ''}</div>
                    <div className="text-sm" style={{ color: 'rgba(255,248,220,0.65)' }}>
                      Theme: {getThemeById(form.design_theme).name}. Your balance: <span className="text-gold font-display">{admin?.available_credits ?? 0}</span>
                    </div>
                  </div>

                  {published && shareLink && (
                    <div className="lux-glass p-6">
                      <div className="lux-eyebrow mb-2">◆ Share Link</div>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <code className="font-mono text-sm break-all" style={{ color: '#FFF8DC' }} data-testid="published-share-link">{window.location.origin}/invite/{shareLink}</code>
                        <a href={`/invite/${shareLink}`} target="_blank" rel="noreferrer" className="lux-btn lux-btn-ghost text-xs" data-testid="open-invite-link">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const result = await save({ publish: true });
                      if (result) setPublished(true);
                    }}
                    disabled={saving || (admin?.available_credits ?? 0) < getThemeById(form.design_theme).creditCost}
                    className="lux-btn w-full justify-center"
                    data-testid="publish-btn"
                  >
                    {saving ? 'Publishing…' : published ? 'Re-publish (free)' : 'Publish Now'}
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={prev} disabled={step === 0} className="lux-btn lux-btn-ghost text-xs disabled:opacity-40" data-testid="step-prev">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-xs tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <button onClick={next} disabled={step === STEPS.length - 1} className="lux-btn text-xs disabled:opacity-40" data-testid="step-next">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AIStoryComposer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onInsert={(text) => { setField('story', text); setAiOpen(false); }}
        defaults={{ bride: form.bride_name, groom: form.groom_name, theme: form.design_theme, kind: 'love_story', language: form.language }}
      />

      <ThemePreviewModal
        open={!!previewTheme}
        theme={previewTheme}
        onClose={() => setPreviewTheme(null)}
        onUse={(themeId) => setField('design_theme', themeId)}
      />
    </LuxuryShell>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */

const Step = ({ title, subtitle, children }) => (
  <div>
    <h2 className="font-display text-3xl md:text-[2.4rem] leading-tight mb-2" style={{ color: '#FFF8DC' }}>{title}</h2>
    {subtitle && <p className="text-sm mb-7" style={{ color: 'rgba(255,248,220,0.6)' }}>{subtitle}</p>}
    <div className="space-y-4">{children}</div>
  </div>
);

const Row = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>{label}</span>
    {children}
  </label>
);

const baseInput = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid var(--lux-border)', borderRadius: '0.5rem', outline: 'none',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', caretColor: '#D4AF37',
};
const Input = ({ value, onChange, type = 'text', placeholder, testid }) => (
  <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={baseInput} data-testid={testid} />
);
const Textarea = ({ value, onChange, rows = 4, testid }) => (
  <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
    style={{ ...baseInput, resize: 'vertical', minHeight: 80 }} data-testid={testid} />
);
const Select = ({ value, onChange, options, testid }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    style={{ ...baseInput, cursor: 'pointer', appearance: 'none' }} data-testid={testid}>
    {options.map((o) => <option key={o} value={o} style={{ background: '#1A130B' }}>{o}</option>)}
  </select>
);

/* ── Multi-language sub-picker (used inside Features step) ──── */
const ALL_LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi', 'Hinglish', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu', 'Odia', 'Assamese'];
const MultiLangPicker = ({ mainLanguage, languages, onChange, profileId }) => {
  const [translating, setTranslating] = React.useState(false);
  const [translateMsg, setTranslateMsg] = React.useState('');
  const toggle = (l) => {
    if (l === mainLanguage) return;
    if (languages.includes(l)) onChange(languages.filter((x) => x !== l));
    else onChange([...languages, l]);
  };
  const runTranslate = async () => {
    if (!profileId) {
      setTranslateMsg('Save the draft once before translating.');
      return;
    }
    if (!languages || languages.length === 0) {
      setTranslateMsg('Pick at least one additional language first.');
      return;
    }
    setTranslating(true);
    setTranslateMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/admin/profiles/${profileId}/translate`);
      const langs = Object.keys(res.data?.translations || {});
      if (res.data?.skipped) {
        setTranslateMsg(res.data?.reason || 'Nothing to translate.');
      } else {
        setTranslateMsg(`Translated into ${langs.length} language${langs.length === 1 ? '' : 's'}: ${langs.join(', ')}`);
      }
    } catch (e) {
      setTranslateMsg(e.response?.data?.detail || 'Translate failed');
    } finally {
      setTranslating(false);
    }
  };
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,248,220,0.04)', border: '1px solid rgba(212,175,55,0.2)' }}
         data-testid="multi-lang-picker">
      <div className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.6)' }}>
        Pick additional languages
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_LANGUAGES.map((l) => {
          const isMain = l === mainLanguage;
          const active = isMain || languages.includes(l);
          return (
            <button key={l} type="button" onClick={() => toggle(l)} disabled={isMain}
              className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all"
              style={{
                background: active ? 'rgba(212,175,55,0.2)' : 'rgba(255,248,220,0.04)',
                border: `1px solid ${active ? '#D4AF37' : 'rgba(255,248,220,0.15)'}`,
                color: active ? '#E8C766' : 'rgba(255,248,220,0.7)',
                cursor: isMain ? 'not-allowed' : 'pointer',
                opacity: isMain ? 0.7 : 1,
              }}
              data-testid={`lang-toggle-${l}`}>
              {l} {isMain && <span className="ml-1 text-[9px] opacity-70">(MAIN)</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'rgba(255,248,220,0.45)' }}>
        Tip: Pick the languages you want available on the public link. Guests can switch languages from the link header. The MAIN language is set in the <strong>Couple</strong> step.
      </p>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button type="button" onClick={runTranslate} disabled={translating}
          className="lux-btn lux-btn-ghost text-[10px] inline-flex items-center gap-2"
          data-testid="translate-now-btn">
          {translating ? 'Translating…' : 'Auto-translate with Gemini'}
        </button>
        {translateMsg && (
          <span className="text-[10px]" style={{ color: 'rgba(255,248,220,0.7)' }}>{translateMsg}</span>
        )}
      </div>
    </div>
  );
};

/* ── Expiry tier selector (used inside Publish step) ──── */
const ExpiryTierSelector = ({ value, onChange }) => {
  const [tiers, setTiers] = React.useState([
    { id: '1_month',  label: '1 Month',   days: 30,  credits: 1 },
    { id: '3_months', label: '3 Months',  days: 90,  credits: 2 },
    { id: '6_months', label: '6 Months',  days: 180, credits: 3 },
    { id: '1_year',   label: '1 Year',    days: 365, credits: 5 },
  ]);
  React.useEffect(() => {
    let cancelled = false;
    axios.get(`${API_URL}/api/admin/expiry-tiers`).then((res) => {
      if (cancelled) return;
      if (Array.isArray(res.data?.tiers) && res.data.tiers.length > 0) setTiers(res.data.tiers);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="lux-glass p-5" data-testid="expiry-tier-card">
      <div className="lux-eyebrow mb-3">◆ Link Expiry — choose how long the invitation stays live</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tiers.map((t) => {
          const active = value === t.id;
          return (
            <button key={t.id} type="button" onClick={() => onChange(t.id)}
              className="p-3 rounded-lg text-left transition-all"
              style={{
                background: active ? 'rgba(212,175,55,0.16)' : 'rgba(255,248,220,0.04)',
                border: `1px solid ${active ? '#D4AF37' : 'rgba(255,248,220,0.15)'}`,
                color: active ? '#FFF8DC' : 'rgba(255,248,220,0.75)',
              }}
              data-testid={`expiry-tier-${t.id}`}>
              <div className="text-sm font-display">{t.label}</div>
              <div className="text-[10px] tracking-[0.15em] uppercase opacity-70 mt-0.5">{t.days} days</div>
              <div className="text-[10px] tracking-[0.15em] uppercase mt-1" style={{ color: '#D4AF37' }}>+ {t.credits} credit{t.credits === 1 ? '' : 's'}</div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'rgba(255,248,220,0.5)' }}>
        Days &amp; credits per tier are configurable from the Super-Admin Pricing panel.
      </p>
    </div>
  );
};

/* ── Events sub-editor ────────────────────────────────────── */
const EVENT_TYPES = ['Mehndi', 'Sangeet', 'Haldi', 'Wedding', 'Reception', 'Engagement', 'Cocktail', 'Sufi Night'];

const slugifyEventType = (t) => (t || 'event').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const EventsEditor = ({ events, onChange, profileId, slug }) => {
  const add = () => onChange([
    ...events,
    {
      id: `tmp-${Date.now()}`,
      event_type: 'Mehndi',
      title: '',
      event_date: '',
      start_time: '',
      venue: '',
      venue_address: '',
      description: '',
      google_map_link: '',
      dress_code: '',
      hero_photo_url: '',
      visible: true,
    },
  ]);
  const update = (i, k, v) => onChange(events.map((e, idx) => idx === i ? { ...e, [k]: v } : e));
  const remove = (i) => onChange(events.filter((_, idx) => idx !== i));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [copiedIdx, setCopiedIdx] = React.useState(null);
  const copy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-4" data-testid="events-editor">
      {events.length === 0 && (
        <div className="lux-glass p-6 text-center" style={{ borderStyle: 'dashed' }}>
          <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>
            No ceremonies added yet. Each ceremony gets its own page and link.
          </p>
        </div>
      )}
      {events.map((e, i) => {
        const eventSlug = slugifyEventType(e.event_type);
        const eventLink = slug ? `${origin}/invite/${slug}/${eventSlug}` : '';
        const isVisible = e.visible !== false; // default ON
        return (
          <div
            key={e.id || i}
            className="lux-glass p-5"
            style={isVisible ? {} : { opacity: 0.55 }}
            data-testid={`event-row-${i}`}
          >
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <span className="lux-eyebrow text-[10px]">
                Ceremony {i + 1} · {e.event_type || 'Event'}
                {!isVisible && <span className="ml-2" style={{ color: '#FFB0A0' }}>· Hidden from guests</span>}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: 'rgba(255,248,220,0.75)' }}
                  data-testid={`event-visible-label-${i}`}
                >
                  <span data-testid={`event-visible-state-${i}`}>{isVisible ? 'Enabled' : 'Disabled'}</span>
                  <button
                    type="button"
                    onClick={() => update(i, 'visible', !isVisible)}
                    className="w-9 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer"
                    style={{ background: isVisible ? '#D4AF37' : 'rgba(255,255,255,0.18)' }}
                    aria-label={isVisible ? 'Disable ceremony' : 'Enable ceremony'}
                    aria-pressed={isVisible}
                    data-testid={`event-visible-toggle-${i}`}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-all pointer-events-none"
                      style={{ background: '#FFF8DC', left: isVisible ? 'calc(100% - 18px)' : '2px' }}
                    />
                  </button>
                </div>
                <button type="button" onClick={() => remove(i)} className="text-xs tracking-widest uppercase" style={{ color: '#FFB0A0' }} data-testid={`remove-event-${i}`}>Remove</button>
              </div>
            </div>
            <Row>
              <Field label="Type"><Select value={e.event_type} onChange={(v) => update(i, 'event_type', v)} options={EVENT_TYPES} testid={`event-type-${i}`} /></Field>
              <Field label="Title"><Input value={e.title} onChange={(v) => update(i, 'title', v)} placeholder="An evening of music" testid={`event-title-${i}`} /></Field>
            </Row>
            <Row>
              <Field label="Date"><Input type="date" value={e.event_date?.slice(0, 10) || ''} onChange={(v) => update(i, 'event_date', v)} testid={`event-date-${i}`} /></Field>
              <Field label="Start Time"><Input type="time" value={e.start_time || ''} onChange={(v) => update(i, 'start_time', v)} testid={`event-time-${i}`} /></Field>
            </Row>
            <Field label="Venue Name"><Input value={e.venue} onChange={(v) => update(i, 'venue', v)} placeholder="The Leela Palace" testid={`event-venue-${i}`} /></Field>
            <Field label="Full Venue Address"><Textarea rows={2} value={e.venue_address || ''} onChange={(v) => update(i, 'venue_address', v)} placeholder="Lake Pichola, Udaipur" testid={`event-address-${i}`} /></Field>
            <Field label="Google Maps Link">
              <Input value={e.google_map_link || ''} onChange={(v) => update(i, 'google_map_link', v)}
                placeholder="https://maps.google.com/?q=…" testid={`event-map-${i}`} />
            </Field>
            <Row>
              <Field label="Dress Code"><Input value={e.dress_code || ''} onChange={(v) => update(i, 'dress_code', v)} placeholder="Pastel · Indo-Western" testid={`event-dresscode-${i}`} /></Field>
              <Field label="Description"><Textarea rows={2} value={e.description || ''} onChange={(v) => update(i, 'description', v)} testid={`event-desc-${i}`} /></Field>
            </Row>

            {/* Hero photo for this event */}
            <div className="mt-4">
              <PhotoUploadField
                label={`${e.event_type || 'Event'} Hero Photo`}
                value={e.hero_photo_url || ''}
                onChange={(v) => update(i, 'hero_photo_url', v)}
                profileId={profileId}
                testid={`event-hero-${i}`}
              />
            </div>

            {/* Per-event shareable link */}
            {slug && (
              <div className="mt-4 px-4 py-3 rounded-lg flex items-center justify-between gap-3 flex-wrap"
                style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)' }}
                data-testid={`event-link-${i}`}
              >
                <div className="min-w-0">
                  <span className="lux-eyebrow text-[9px] block mb-1">◆ Separate link for {e.event_type}</span>
                  <code className="font-mono text-xs break-all" style={{ color: '#FFF8DC' }}>{eventLink}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => copy(eventLink, i)}
                    className="lux-btn lux-btn-ghost text-[10px] inline-flex items-center gap-1.5"
                    data-testid={`event-copy-${i}`}
                  >
                    {copiedIdx === i ? <><Check className="w-3 h-3" /> Copied</> : 'Copy'}
                  </button>
                  <a href={eventLink} target="_blank" rel="noreferrer"
                    className="lux-btn text-[10px] inline-flex items-center gap-1.5"
                    data-testid={`event-open-${i}`}
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                </div>
              </div>
            )}
            {!slug && (
              <p className="mt-3 text-[11px] italic" style={{ color: 'rgba(255,248,220,0.45)' }}>
                Save the wedding draft first to generate the separate ceremony link.
              </p>
            )}
          </div>
        );
      })}
      <button type="button" onClick={add} className="lux-btn lux-btn-ghost w-full justify-center" data-testid="add-event">
        + Add Ceremony
      </button>
    </div>
  );
};

export default LuxuryProfileForm;
