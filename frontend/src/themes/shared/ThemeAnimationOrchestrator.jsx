/* ════════════════════════════════════════════════════════════════════════
 * Theme Opening / Closing Orchestrators (May 2026 — Event-Specific 3D Animations)
 *
 * NOW USES EVENT-SPECIFIC 3D OPENING ANIMATIONS
 * 
 * Each theme now has 4 unique opening animations based on event type:
 *   - Marriage: Grand, ceremonial, majestic
 *   - Engagement: Romantic, intimate, elegant  
 *   - Reception: Celebratory, festive, vibrant
 *   - Haldi/Sangeet/Mehendi: Colorful flowers + powder bursts (shared)
 *
 * The new ThemeOrchestrator detects event type and loads the appropriate
 * 3D animation with stunning visual effects, dynamic backgrounds, and
 * theme-appropriate elements.
 *
 * CinematicClosing still uses design photos for the ending sequence.
 * ════════════════════════════════════════════════════════════════════════ */
import React, { lazy, Suspense } from 'react';
import CinematicClosing from './CinematicClosing';

// NEW: Import the event-aware ThemeOrchestrator
const ThemeOrchestrator = lazy(() => import('../ThemeOrchestrator'));
const CinematicHeroOpening = lazy(() => import('./CinematicHeroOpening'));

/**
 * Lightweight cinematic loader rendered while the heavy 3D opening
 * animation chunk is downloading. Prevents the previous "blank white
 * screen for several seconds" symptom on slow networks.
 */
const OpeningLoader = () => (
  <div
    aria-hidden="true"
    data-testid="opening-orchestrator-loader"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'grid',
      placeItems: 'center',
      background:
        'radial-gradient(ellipse at center, #1A130B 0%, #08050B 80%)',
      color: '#D4AF37',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          margin: '0 auto 18px',
          border: '2px solid rgba(212,175,55,0.15)',
          borderTopColor: '#D4AF37',
          animation: 'opLoaderSpin 1.1s linear infinite',
        }}
      />
      <div
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 11,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(255,248,220,0.6)',
        }}
      >
        Unfolding your invitation
      </div>
      <style>{`@keyframes opLoaderSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

export function OpeningOrchestrator({ themeId, event, eventType, image, bride, groom, date, monogram, onComplete }) {
  // Determine event type from multiple possible sources
  const determinedEventType = eventType || event?.event_type || event?.type || 'marriage';
  
  // Use new event-specific 3D animations for ALL themes (40 combos wired in ThemeOrchestrator)
  const useNew3DAnimations = true;
  
  if (useNew3DAnimations) {
    return (
      <Suspense fallback={<OpeningLoader />}>
        <ThemeOrchestrator
          themeId={themeId}
          eventType={determinedEventType}
          brideName={bride}
          groomName={groom}
          monogram={monogram}
          subtitle={`${determinedEventType} Ceremony`}
          onComplete={onComplete}
        />
      </Suspense>
    );
  }
  
  // Fallback to existing cinematic opening for themes without new animations yet
  return (
    <Suspense fallback={<OpeningLoader />}>
      <CinematicHeroOpening
        themeId={themeId}
        event={event}
        image={image}
        bride={bride}
        groom={groom}
        date={date}
        monogram={monogram}
        onComplete={onComplete}
      />
    </Suspense>
  );
}

export function ClosingOrchestrator({ themeId, image, bride, groom, date, event, eventType }) {
  const determinedEventType = eventType || event?.event_type || event?.type || 'marriage';
  return (
    <CinematicClosing
      themeId={themeId}
      image={image}
      bride={bride}
      groom={groom}
      date={date}
      eventType={determinedEventType}
    />
  );
}

export default OpeningOrchestrator;
