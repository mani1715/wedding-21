import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Search, MapPin, BedDouble, Building2, Clock, ExternalLink, Sparkles } from 'lucide-react';
import ScrollSection from './ScrollSection';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Find My Room — guests search their name to see their assigned accommodation.
 * Uses the public partial-match endpoint `/api/invite/{slug}/room-lookup?name=...`.
 */
const FindMyRoomSection = ({ slug, hasRooms }) => {
  const [name, setName] = useState('');
  const [matches, setMatches] = useState(null); // null = not searched, [] = no results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only render if the couple uploaded at least one room
  if (!hasRooms) return null;

  const onSearch = async (e) => {
    e?.preventDefault?.();
    setError('');
    const q = name.trim();
    if (q.length < 2) {
      setError('Please enter at least 2 characters of your name.');
      return;
    }
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/api/invite/${slug}/room-lookup`, {
        params: { name: q },
      });
      setMatches(r.data?.matches || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Lookup failed. Please try again.');
      setMatches(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName('');
    setMatches(null);
    setError('');
  };

  return (
    <ScrollSection className="px-6 md:px-16 py-24 max-w-3xl mx-auto" testid="section-find-my-room">
      <span className="lux-eyebrow block mb-5">◆ Where you'll stay</span>
      <h2 className="font-display text-[2.4rem] md:text-[3.4rem] leading-[1.05] mb-3" style={{ color: '#FFF8DC' }}>
        Find <span className="text-gold italic font-script">your room.</span>
      </h2>
      <p className="text-sm md:text-base mb-8" style={{ color: 'rgba(255,248,220,0.7)' }}>
        Type your name (or part of it) to see your assigned accommodation and how to get there.
      </p>

      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3 mb-2" data-testid="room-lookup-form">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,248,220,0.5)' }} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your full name…"
            className="w-full"
            data-testid="room-lookup-input"
            style={{
              padding: '0.85rem 1rem 0.85rem 2.6rem',
              background: 'rgba(255,248,220,0.04)',
              color: '#FFF8DC',
              border: '1px solid var(--lux-border)',
              borderRadius: '0.55rem',
              outline: 'none',
              caretColor: '#D4AF37',
              fontSize: '0.95rem',
            }}
          />
        </div>
        <button type="submit" disabled={loading} className="lux-btn justify-center sm:w-44" data-testid="room-lookup-submit">
          {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <><Search className="w-3.5 h-3.5" /> Search</>}
        </button>
      </form>

      {error && (
        <div className="text-xs italic mt-2" style={{ color: '#FFB0A0' }} data-testid="room-lookup-error">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {matches !== null && (
          <motion.div
            key={matches.length}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="mt-8 space-y-4"
            data-testid="room-lookup-results"
          >
            {matches.length === 0 && (
              <div className="lux-glass p-6 text-center" style={{ borderStyle: 'dashed' }}>
                <p className="text-sm" style={{ color: 'rgba(255,248,220,0.7)' }}>
                  No matching room found for <span className="text-gold italic">"{name}"</span>.
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,248,220,0.5)' }}>
                  Try a shorter name (e.g. just your first name) or check with the family.
                </p>
                <button
                  onClick={reset}
                  className="lux-btn lux-btn-ghost text-xs mt-4 mx-auto"
                  data-testid="room-lookup-reset"
                >
                  Try again
                </button>
              </div>
            )}

            {matches.map((r, idx) => (
              <RoomCard key={r.id || idx} room={r} index={idx} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollSection>
  );
};

const RoomCard = ({ room, index }) => {
  const mapQuery = encodeURIComponent(
    [room.building, room.address].filter(Boolean).join(', ') || room.guest_name
  );
  const fallbackMap = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapLink = room.map_link || (room.address || room.building ? fallbackMap : '');

  // Build a lightweight embed using Google Maps' search embed (no API key)
  const embedSrc = mapQuery
    ? `https://www.google.com/maps?q=${mapQuery}&output=embed`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="lux-glass p-6"
      data-testid={`room-result-${index}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <span className="lux-eyebrow text-[10px] block mb-1">◆ Reserved for</span>
          <div className="font-display text-2xl md:text-3xl" style={{ color: '#FFF8DC' }} data-testid={`room-guest-name-${index}`}>
            {room.guest_name}
          </div>
        </div>
        {room.room_number && (
          <div className="px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm"
            style={{ background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#16110C', fontWeight: 600 }}
            data-testid={`room-number-${index}`}
          >
            <BedDouble className="w-3.5 h-3.5" /> Room {room.room_number}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {room.building && (
          <div className="flex items-start gap-2" style={{ color: 'rgba(255,248,220,0.85)' }}>
            <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span><span className="opacity-60">Building · </span>{room.building}</span>
          </div>
        )}
        {room.floor && (
          <div className="flex items-start gap-2" style={{ color: 'rgba(255,248,220,0.85)' }}>
            <BedDouble className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span><span className="opacity-60">Floor · </span>{room.floor}</span>
          </div>
        )}
        {room.check_in && (
          <div className="flex items-start gap-2" style={{ color: 'rgba(255,248,220,0.85)' }}>
            <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span><span className="opacity-60">Check-in · </span>{room.check_in}</span>
          </div>
        )}
        {room.check_out && (
          <div className="flex items-start gap-2" style={{ color: 'rgba(255,248,220,0.85)' }}>
            <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span><span className="opacity-60">Check-out · </span>{room.check_out}</span>
          </div>
        )}
        {room.address && (
          <div className="flex items-start gap-2 md:col-span-2" style={{ color: 'rgba(255,248,220,0.85)' }}>
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span>{room.address}</span>
          </div>
        )}
      </div>

      {room.notes && (
        <div className="mt-4 px-4 py-3 rounded-lg text-xs italic"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#FFF8DC' }}
          data-testid={`room-notes-${index}`}
        >
          {room.notes}
        </div>
      )}

      {embedSrc && (
        <div className="mt-5 overflow-hidden rounded-lg" style={{ border: '1px solid var(--lux-border)' }}>
          <iframe
            title={`Map for ${room.guest_name}`}
            src={embedSrc}
            width="100%"
            height="220"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0, display: 'block' }}
            data-testid={`room-map-embed-${index}`}
          />
        </div>
      )}

      {mapLink && (
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="lux-btn lux-btn-ghost text-xs mt-4 inline-flex items-center gap-2"
          data-testid={`room-open-map-${index}`}
        >
          Open in Maps <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </motion.div>
  );
};

export default FindMyRoomSection;
