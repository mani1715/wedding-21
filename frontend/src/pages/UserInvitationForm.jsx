import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, ArrowRight, Calendar, MapPin, Heart, MessageCircle, Coins,
  Copy, Check, Share2, Download,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useUserAuth } from '@/context/UserAuthContext';
import { ALL_DESIGNS, useThemeDesigns } from '../themes/allDesigns';
import UniversalDesignRenderer from '../themes/UniversalDesignRenderer';
import { resolveHeroDesign } from '../themes/themeDesignResolver';
import PhotoUploadField from '../components/luxury/PhotoUploadField';
import GuestRoomsEditor from '../components/luxury/GuestRoomsEditor';
import PreWeddingLinksEditor from '../components/luxury/PreWeddingLinksEditor';
import GalleryPrivacyEditor, { validatePrivacy } from '../components/luxury/GalleryPrivacyEditor';
import '../styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const EVENT_TYPE_MAP = {
  Engagement: 'engagement',
  Haldi: 'haldi',
  Mehandi: 'mehandi',
  Marriage: 'marriage',
  Reception: 'reception',
  Sangeeth: 'sangeet',
};

const fieldStyle = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid var(--lux-border)', borderRadius: '0.55rem', outline: 'none',
  caretColor: '#D4AF37', fontSize: '0.95rem',
};

const Field = ({ label, hint, children, testId }) => (
  <label className="block" data-testid={testId ? `field-${testId}` : undefined}>
    <span className="text-[10px] tracking-[0.25em] uppercase block mb-1.5" style={{ color: 'rgba(255,248,220,0.6)' }}>
      {label}
    </span>
    {children}
    {hint && <div className="text-[10px] mt-1 italic" style={{ color: 'rgba(255,248,220,0.4)' }}>{hint}</div>}
  </label>
);

export default function UserInvitationForm() {
  const { themeId, event, designId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, refresh } = useUserAuth();

  // ── Add-ons carried over from PurchaseOptionsWizard via ?addons=a,b,c
  // and ?expiry=1_month.  These are already "paid" in the wizard flow,
  // so we display them as ✓ Purchased — included.
  const purchasedAddonIds = useMemo(() => {
    const raw = searchParams.get('addons') || '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }, [searchParams]);
  const expiryTierId = searchParams.get('expiry') || null;
  const [addonCatalog, setAddonCatalog] = useState([]);
  const [expiryTiers, setExpiryTiers] = useState([]);

  // PHASE 8: lazy-load this specific theme's design config.
  const themeData = useThemeDesigns(themeId) || ALL_DESIGNS?.[themeId];
  const allEventDesigns = themeData?.events?.[event] || [];
  const design = allEventDesigns.find((d) => d.id === designId);
  const themeRes = resolveHeroDesign(themeId);

  const [cost, setCost] = useState(1);
  const [form, setForm] = useState({
    groom_name: '',
    bride_name: '',
    event_date: '',
    venue: '',
    city: '',
    invitation_message: '',
    whatsapp_groom: '',
    whatsapp_bride: '',
    about_couple: '',
    love_story: '',
    bride_about: '',
    groom_about: '',
    bride_photo_url: '',
    groom_photo_url: '',
    couple_photo_url: '',
    guest_rooms: [],
    pre_wedding_links: [],
    gallery_privacy: { enabled: false, code: '', confirm_code: '', remember_days: 30,
                       public_highlights_enabled: true, private_full_gallery_enabled: true,
                       ai_face_match_enabled: true, allow_downloads: true, allow_share: true,
                       expires_at: '', has_password: false },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    document.body.classList.add('luxe', 'luxe-grain', 'luxe-vignette');
    return () => document.body.classList.remove('luxe', 'luxe-grain', 'luxe-vignette');
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/', { replace: true }); return; }
    if (!design) { navigate('/user/create-invitation', { replace: true }); return; }
    axios.get(`${API_URL}/api/public/design-pricing`)
      .then((r) => setCost(r.data?.pricing?.[designId]?.credits ?? 1));
    // Load the add-on catalogue + expiry tiers so we can render the
    // "Purchased — included" badges (and show their human-readable labels).
    if (purchasedAddonIds.length || expiryTierId) {
      Promise.all([
        axios.get(`${API_URL}/api/public/addons`).catch(() => ({ data: { addons: [] } })),
        axios.get(`${API_URL}/api/public/expiry-tiers`).catch(() => ({ data: { tiers: [] } })),
      ]).then(([a, t]) => {
        setAddonCatalog(a.data?.addons || []);
        setExpiryTiers(t.data?.tiers || []);
      });
    }
  }, [loading, user, design, designId, navigate, purchasedAddonIds.length, expiryTierId]);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (!form.bride_name.trim() || !form.groom_name.trim()) {
      setError('Please fill bride and groom names.');
      return;
    }
    if (!form.event_date) {
      setError('Please pick the event date.');
      return;
    }
    // Privacy validation
    if (form.gallery_privacy?.enabled) {
      const pvErr = validatePrivacy(form.gallery_privacy);
      if (pvErr) {
        setError(pvErr);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        design_id: designId,
        groom_name: form.groom_name.trim(),
        bride_name: form.bride_name.trim(),
        event_type: EVENT_TYPE_MAP[event] || event.toLowerCase(),
        event_date: new Date(form.event_date).toISOString(),
        venue: form.venue.trim(),
        city: form.city.trim(),
        invitation_message: form.invitation_message.trim(),
        whatsapp_groom: form.whatsapp_groom.trim() || null,
        whatsapp_bride: form.whatsapp_bride.trim() || null,
        about_couple: form.about_couple.trim() || null,
        love_story: form.love_story.trim() || null,
        bride_about: form.bride_about.trim() || null,
        groom_about: form.groom_about.trim() || null,
        bride_photo_url: form.bride_photo_url.trim() || null,
        groom_photo_url: form.groom_photo_url.trim() || null,
        couple_photo_url: form.couple_photo_url.trim() || null,
        guest_rooms: (form.guest_rooms || [])
          .filter((r) => (r.guest_name || '').trim())
          .map((r) => ({
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
        pre_wedding_links: (form.pre_wedding_links || [])
          .filter((l) => (l.url || '').trim())
          .map((l) => ({
            label: (l.label || 'Pre-wedding').trim(),
            url: (l.url || '').trim(),
            kind: l.kind || 'auto',
          })),
        gallery_privacy: form.gallery_privacy?.enabled
          ? {
              enabled: true,
              code: form.gallery_privacy.code,
              confirm_code: form.gallery_privacy.confirm_code,
              remember_days: form.gallery_privacy.remember_days || 30,
              public_highlights_enabled: !!form.gallery_privacy.public_highlights_enabled,
              private_full_gallery_enabled: !!form.gallery_privacy.private_full_gallery_enabled,
              ai_face_match_enabled: !!form.gallery_privacy.ai_face_match_enabled,
              allow_downloads: !!form.gallery_privacy.allow_downloads,
              allow_share: !!form.gallery_privacy.allow_share,
              expires_at: form.gallery_privacy.expires_at || null,
            }
          : null,
      };
      const { data } = await axios.post(`${API_URL}/api/users/profiles`, payload, { withCredentials: true });

      // If the user came through the PurchaseOptionsWizard, charge the
      // selected add-ons against this freshly-created profile so they
      // show up as "purchased" in `profile.add_ons`.
      const newProfile = data?.profile;
      if (newProfile?.id && purchasedAddonIds.length > 0) {
        for (const addonId of purchasedAddonIds) {
          try {
            await axios.post(
              `${API_URL}/api/users/profiles/${newProfile.id}/buy-addon`,
              { addon_id: addonId },
              { withCredentials: true },
            );
          } catch (_e) {
            // Silently swallow — if balance ran out mid-flow we'll still
            // show the success screen for the invitation itself.
          }
        }
      }

      await refresh?.();
      setSuccess(newProfile);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail?.error === 'Insufficient credits') {
        setError(`Need ${detail.required} credits — your balance is ${detail.balance}.`);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err?.message || 'Could not create invitation.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !design || !themeRes) {
    return (
      <div className="luxe min-h-screen grid place-items-center">
        <Sparkles className="w-6 h-6 animate-pulse text-gold" />
      </div>
    );
  }

  if (success) {
    const link = success.invitation_link;
    const fullUrl = `${window.location.origin}${link}`;
    return <InvitationSuccessScreen fullUrl={fullUrl} link={link} navigate={navigate} />;
  }

  return (
    <div className="luxe min-h-screen px-5 md:px-12 py-8 md:py-12" data-testid="user-invitation-form">
      <button
        onClick={() => navigate('/user/create-invitation')}
        className="text-[10px] tracking-[0.25em] uppercase mb-5 inline-flex items-center gap-2 hover:opacity-80"
        style={{ color: 'rgba(255,248,220,0.6)' }}
        data-testid="form-back-btn"
      >
        <ArrowLeft className="w-3 h-3" /> Pick a different design
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live preview */}
        <div className="order-2 lg:order-1">
          <span className="lux-eyebrow block mb-3">◆ Live Preview</span>
          <div className="max-w-md mx-auto" data-testid="form-live-preview">
            <UniversalDesignRenderer
              design={{ ...themeRes.design, image: design.image, id: design.id }}
              theme={themeRes.theme}
              bride={form.bride_name || ''}
              groom={form.groom_name || ''}
              date={form.event_date ? new Date(form.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
              venue={[form.venue, form.city].filter(Boolean).join(' · ')}
              testId="form-preview-render"
            />
          </div>
          {/* Purchased add-ons summary — only shown if the user came
              through the PurchaseOptionsWizard with ?addons=… */}
          <div className="mt-4 p-4 lux-glass flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>This Design</div>
              <div className="font-display text-base mt-0.5" style={{ color: '#FFF8DC' }}>{design.title}</div>
            </div>
            <div className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#16110C' }}
            >
              <Coins className="w-3 h-3" /> {cost} credit{cost === 1 ? '' : 's'}
            </div>
          </div>
          {(purchasedAddonIds.length > 0 || expiryTierId) && (
            <div className="lux-glass p-4 mt-4" data-testid="purchased-addons">
              <span className="lux-eyebrow block mb-2">◆ Purchased — included</span>
              <ul className="space-y-1.5 text-xs" style={{ color: 'rgba(255,248,220,0.85)' }}>
                {purchasedAddonIds.map((id) => {
                  const meta = addonCatalog.find((a) => a.id === id);
                  return (
                    <li key={id} className="flex items-center gap-2" data-testid={`purchased-addon-${id}`}>
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span className="flex-1">{meta?.label || id}</span>
                      {meta?.credits != null && (
                        <span className="text-[10px] tracking-[0.18em] uppercase opacity-70">
                          {meta.credits} credit{meta.credits === 1 ? '' : 's'}
                        </span>
                      )}
                    </li>
                  );
                })}
                {expiryTierId && (
                  <li className="flex items-center gap-2" data-testid="purchased-expiry">
                    <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="flex-1">
                      Link expiry · {expiryTiers.find((t) => t.id === expiryTierId)?.label || expiryTierId}
                    </span>
                    {expiryTiers.find((t) => t.id === expiryTierId)?.credits != null && (
                      <span className="text-[10px] tracking-[0.18em] uppercase opacity-70">
                        {expiryTiers.find((t) => t.id === expiryTierId).credits} credit{expiryTiers.find((t) => t.id === expiryTierId).credits === 1 ? '' : 's'}
                      </span>
                    )}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Form */}
        <form className="order-1 lg:order-2 lux-glass p-7 space-y-4" onSubmit={submit}>
          <span className="lux-eyebrow block">◆ Your Story</span>
          <h2 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>
            Fill in the <span className="font-script italic text-gold">details.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bride's name *" testId="bride">
              <input style={fieldStyle} required value={form.bride_name} onChange={set('bride_name')} data-testid="input-bride-name" />
            </Field>
            <Field label="Groom's name *" testId="groom">
              <input style={fieldStyle} required value={form.groom_name} onChange={set('groom_name')} data-testid="input-groom-name" />
            </Field>
          </div>

          <Field label="Event date *" testId="date">
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,248,220,0.5)' }} />
              <input type="date" required value={form.event_date} onChange={set('event_date')} style={{ ...fieldStyle, paddingLeft: '2.6rem' }} data-testid="input-event-date" />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Venue" testId="venue">
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,248,220,0.5)' }} />
                <input style={{ ...fieldStyle, paddingLeft: '2.6rem' }} value={form.venue} onChange={set('venue')} placeholder="e.g. Falaknuma Palace" data-testid="input-venue" />
              </div>
            </Field>
            <Field label="City" testId="city">
              <input style={fieldStyle} value={form.city} onChange={set('city')} placeholder="e.g. Hyderabad" data-testid="input-city" />
            </Field>
          </div>

          <Field label="Invitation message" testId="message" hint="A short note from the couple — appears under the names.">
            <div className="relative">
              <MessageCircle className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none" style={{ color: 'rgba(255,248,220,0.5)' }} />
              <textarea rows={3} style={{ ...fieldStyle, paddingLeft: '2.6rem' }} value={form.invitation_message} onChange={set('invitation_message')} placeholder="Together with our families…" data-testid="input-message" />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bride's WhatsApp" testId="wa-bride">
              <input style={fieldStyle} value={form.whatsapp_bride} onChange={set('whatsapp_bride')} placeholder="+91 99999 99999" data-testid="input-whatsapp-bride" />
            </Field>
            <Field label="Groom's WhatsApp" testId="wa-groom">
              <input style={fieldStyle} value={form.whatsapp_groom} onChange={set('whatsapp_groom')} placeholder="+91 99999 99999" data-testid="input-whatsapp-groom" />
            </Field>
          </div>

          <Field label="About the couple" testId="about" hint="Optional — appears on the story section.">
            <textarea rows={3} style={fieldStyle} value={form.about_couple} onChange={set('about_couple')} placeholder="A short biography…" data-testid="input-about" />
          </Field>

          {/* Bride / Groom mini-bios — render next to their portraits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="About the Bride" testId="bride-about" hint="Optional — appears next to her photo.">
              <textarea rows={3} maxLength={500} style={fieldStyle} value={form.bride_about} onChange={set('bride_about')} placeholder="Her work, her passions, what makes her glow…" data-testid="input-bride-about" />
            </Field>
            <Field label="About the Groom" testId="groom-about" hint="Optional — appears next to his photo.">
              <textarea rows={3} maxLength={500} style={fieldStyle} value={form.groom_about} onChange={set('groom_about')} placeholder="His passions, what makes him laugh, his story…" data-testid="input-groom-about" />
            </Field>
          </div>

          {/* Photo uploads — drag-and-drop, no profile needed (user endpoint) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="user-photo-uploads">
            <PhotoUploadField
              label="Bride photo"
              value={form.bride_photo_url}
              onChange={(url) => setForm((f) => ({ ...f, bride_photo_url: url }))}
              mode="user"
              slot="bride"
              testid="upload-bride-photo"
            />
            <PhotoUploadField
              label="Groom photo"
              value={form.groom_photo_url}
              onChange={(url) => setForm((f) => ({ ...f, groom_photo_url: url }))}
              mode="user"
              slot="groom"
              testid="upload-groom-photo"
            />
            <PhotoUploadField
              label="Couple photo"
              value={form.couple_photo_url}
              onChange={(url) => setForm((f) => ({ ...f, couple_photo_url: url }))}
              mode="user"
              slot="couple"
              testid="upload-couple-photo"
            />
          </div>

          <Field label="Love story" testId="story" hint="Optional — your love story in a paragraph.">
            <div className="relative">
              <Heart className="w-4 h-4 absolute left-3.5 top-3 pointer-events-none" style={{ color: 'rgba(255,248,220,0.5)' }} />
              <textarea rows={3} style={{ ...fieldStyle, paddingLeft: '2.6rem' }} value={form.love_story} onChange={set('love_story')} placeholder="How you met…" data-testid="input-love-story" />
            </div>
          </Field>

          {/* Pre-wedding shoot links */}
          <div className="pt-2">
            <span className="lux-eyebrow block mb-2">◆ Pre-wedding film (Google Drive · YouTube · Vimeo)</span>
            <p className="text-[11px] mb-3 italic" style={{ color: 'rgba(255,248,220,0.5)' }}>
              Optional — paste a shareable Drive link to embed your pre-wedding video on the invitation.
            </p>
            <PreWeddingLinksEditor
              links={form.pre_wedding_links}
              onChange={(links) => setForm((f) => ({ ...f, pre_wedding_links: links }))}
            />
          </div>

          {/* Guest room directory */}
          <div className="pt-2">
            <span className="lux-eyebrow block mb-2">◆ Find My Room · Guest accommodation</span>
            <p className="text-[11px] mb-3 italic" style={{ color: 'rgba(255,248,220,0.5)' }}>
              Optional — add one row per guest. They'll search by name on the invitation to see their room + map.
            </p>
            <GuestRoomsEditor
              rooms={form.guest_rooms}
              onChange={(rooms) => setForm((f) => ({ ...f, guest_rooms: rooms }))}
              compact
            />
          </div>

          {/* Photo privacy / gallery access code */}
          <div className="pt-2">
            <span className="lux-eyebrow block mb-2">◆ Photo Privacy · Lock the gallery</span>
            <p className="text-[11px] mb-3 italic" style={{ color: 'rgba(255,248,220,0.5)' }}>
              Optional — protect your wedding photos with an access code so they stay private even if the link or QR is shared.
            </p>
            <GalleryPrivacyEditor
              value={form.gallery_privacy}
              onChange={(v) => setForm((f) => ({ ...f, gallery_privacy: v }))}
              compact
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-md text-xs"
              style={{ background: 'rgba(139,0,0,0.18)', border: '1px solid rgba(139,0,0,0.5)', color: '#FFD7C9' }}
              data-testid="form-error">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs" style={{ color: 'rgba(255,248,220,0.6)' }}>
              Will charge <span className="text-gold font-semibold">{cost}</span> credit{cost === 1 ? '' : 's'} · balance {user?.credits ?? 0}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="lux-btn justify-center"
              data-testid="form-submit-btn"
            >
              {submitting ? <><Sparkles className="w-4 h-4 animate-pulse" /> Publishing…</> : <>Publish invitation <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function InvitationSuccessScreen({ fullUrl, link, navigate }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      // fallback: prompt
      window.prompt('Copy this link:', fullUrl);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Our Wedding Invitation', url: fullUrl });
      } catch (_e) { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('[data-testid="success-qr-code"] canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation-${link.replace(/[^a-z0-9]/gi, '-')}.png`;
    a.click();
  };

  return (
    <div className="luxe min-h-screen grid place-items-center px-5 py-10" data-testid="user-invitation-success">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="lux-glass p-8 md:p-10 max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        >
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
        </motion.div>
        <h2 className="font-display text-3xl md:text-4xl mb-3" style={{ color: '#FFF8DC' }}>
          Your invitation is <span className="italic font-script text-gold">live.</span>
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,248,220,0.7)' }}>
          Share the link or QR with your loved ones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7 items-stretch">
          {/* QR Code */}
          <div
            className="flex flex-col items-center justify-center p-5 rounded-md"
            style={{ background: 'rgba(255,248,220,0.96)', border: '1px solid rgba(212,175,55,0.4)' }}
            data-testid="success-qr-block"
          >
            <div data-testid="success-qr-code" className="bg-white p-2 rounded">
              <QRCodeCanvas
                value={fullUrl}
                size={170}
                fgColor="#1a0e00"
                bgColor="#FFFFFF"
                level="M"
                includeMargin={false}
              />
            </div>
            <button
              onClick={downloadQR}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase hover:opacity-70"
              style={{ color: '#5d4a1a' }}
              data-testid="success-qr-download"
            >
              <Download className="w-3 h-3" /> Download QR
            </button>
          </div>

          {/* Link + actions */}
          <div className="flex flex-col justify-center text-left">
            <div className="text-[10px] tracking-[0.25em] uppercase mb-1.5" style={{ color: 'rgba(255,248,220,0.55)' }}>
              Invitation Link
            </div>
            <div
              className="p-3 rounded-md text-xs break-all mb-3"
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.25)',
                color: '#D4AF37',
                fontFamily: 'monospace',
              }}
              data-testid="success-invitation-link"
            >
              {fullUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="lux-btn lux-btn-ghost flex-1 justify-center text-xs"
                data-testid="success-copy-link"
              >
                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy link</>}
              </button>
              <button
                onClick={shareLink}
                className="lux-btn lux-btn-ghost flex-1 justify-center text-xs"
                data-testid="success-share-link"
              >
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="lux-btn lux-btn-ghost flex-1 justify-center"
            onClick={() => navigate('/user/dashboard')}
            data-testid="success-back-dashboard"
          >
            Back to studio
          </button>
          <button
            className="lux-btn flex-1 justify-center"
            onClick={() => window.open(link, '_blank')}
            data-testid="success-view-invitation"
          >
            View invitation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
