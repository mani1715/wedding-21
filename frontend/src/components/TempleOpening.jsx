import React, { useEffect, useState } from 'react';
import { getDeity } from '@/config/religiousAssets';

/**
 * TempleOpening Component
 * 
 * Temple-style opening section for lord-enabled events
 * Features:
 * - Top-left & top-right hanging GANTALU (temple bells) with ropes
 * - Soft DĪPĀLU (oil lamp) glow near bottom corners
 * - Center LORD image (hero position)
 * 
 * Applies to: Engagement, Marriage, Reception (only if deity enabled)
 * Rules: No sound, no heavy animation, subtle opacity, mobile-first
 */
const TempleOpening = ({ deityId, eventType }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [deityImage, setDeityImage] = useState(null);

  useEffect(() => {
    if (!deityId || deityId === 'none') return;
    
    const deity = getDeity(deityId);
    if (!deity || !deity.images) return;

    // Load appropriate deity image based on screen size
    const isMobile = window.innerWidth < 768;
    const img = new Image();
    img.src = isMobile ? deity.images.mobile : deity.images.desktop;
    img.onload = () => {
      setDeityImage(img.src);
      setImageLoaded(true);
    };
  }, [deityId]);

  // Don't render if no deity or deity is 'none'
  if (!deityId || deityId === 'none' || !deityImage) {
    return null;
  }

  // Only render for specific event types
  const allowedEvents = ['engagement', 'marriage', 'reception'];
  if (eventType && !allowedEvents.includes(eventType.toLowerCase())) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50" 
         style={{ 
           minHeight: '400px',
           maxHeight: '600px',
           height: '60vh'
         }}>
      
      {/* Temple Bells (Gantalu) - Top Left */}
      <div className="absolute top-0 left-4 md:left-8 z-10">
        {/* Rope */}
        <div 
          className="w-1 bg-gradient-to-b from-amber-800 to-amber-600 mx-auto"
          style={{ height: '80px', opacity: 0.7 }}
        />
        {/* Bell */}
        <div 
          className="relative w-12 h-16 md:w-16 md:h-20 mx-auto"
          style={{
            animation: 'gentle-swing 4s ease-in-out infinite',
            transformOrigin: 'top center'
          }}
        >
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
            {/* Bell body */}
            <path 
              d="M20 30 Q20 20 50 20 Q80 20 80 30 L75 80 Q75 90 50 95 Q25 90 25 80 Z" 
              fill="url(#bellGradient)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Bell clapper */}
            <circle cx="50" cy="100" r="8" fill="#78350f" />
            <line x1="50" y1="85" x2="50" y2="92" stroke="#78350f" strokeWidth="3" />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="bellGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Temple Bells (Gantalu) - Top Right */}
      <div className="absolute top-0 right-4 md:right-8 z-10">
        {/* Rope */}
        <div 
          className="w-1 bg-gradient-to-b from-amber-800 to-amber-600 mx-auto"
          style={{ height: '80px', opacity: 0.7 }}
        />
        {/* Bell */}
        <div 
          className="relative w-12 h-16 md:w-16 md:h-20 mx-auto"
          style={{
            animation: 'gentle-swing-reverse 4s ease-in-out infinite',
            transformOrigin: 'top center'
          }}
        >
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
            {/* Bell body */}
            <path 
              d="M20 30 Q20 20 50 20 Q80 20 80 30 L75 80 Q75 90 50 95 Q25 90 25 80 Z" 
              fill="url(#bellGradient2)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Bell clapper */}
            <circle cx="50" cy="100" r="8" fill="#78350f" />
            <line x1="50" y1="85" x2="50" y2="92" stroke="#78350f" strokeWidth="3" />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="bellGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Center Deity Image */}
      <div className="absolute inset-0 flex items-center justify-center z-5">
        <div className="relative w-full max-w-md px-4">
          <img
            src={deityImage}
            alt="Lord"
            className="w-full h-auto object-contain rounded-lg transition-all duration-500"
            style={{
              maxHeight: '350px',
              opacity: imageLoaded ? 0.9 : 0,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
            }}
          />
        </div>
      </div>

      {/* Oil Lamps (Dīpālu) - Bottom Left */}
      <div className="absolute bottom-8 left-4 md:left-8 z-10">
        <div className="relative w-16 h-20 md:w-20 md:h-24">
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Lamp stand */}
            <ellipse cx="50" cy="110" rx="35" ry="8" fill="#78350f" opacity="0.8" />
            <rect x="45" y="70" width="10" height="40" fill="#92400e" />
            
            {/* Lamp bowl */}
            <ellipse cx="50" cy="70" rx="30" ry="12" fill="#b45309" />
            <path d="M20 70 Q50 75 80 70" fill="#d97706" />
            
            {/* Flame */}
            <g style={{ animation: 'flicker 2s ease-in-out infinite' }}>
              <ellipse cx="50" cy="50" rx="15" ry="25" fill="url(#flameGradient)" opacity="0.9" />
              <ellipse cx="50" cy="55" rx="10" ry="18" fill="#fbbf24" opacity="0.7" />
            </g>
            
            {/* Glow */}
            <circle cx="50" cy="50" r="40" fill="url(#glowGradient)" opacity="0.3" />
            
            {/* Gradients */}
            <defs>
              <radialGradient id="flameGradient">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
              <radialGradient id="glowGradient">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Oil Lamps (Dīpālu) - Bottom Right */}
      <div className="absolute bottom-8 right-4 md:right-8 z-10">
        <div className="relative w-16 h-20 md:w-20 md:h-24">
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Lamp stand */}
            <ellipse cx="50" cy="110" rx="35" ry="8" fill="#78350f" opacity="0.8" />
            <rect x="45" y="70" width="10" height="40" fill="#92400e" />
            
            {/* Lamp bowl */}
            <ellipse cx="50" cy="70" rx="30" ry="12" fill="#b45309" />
            <path d="M20 70 Q50 75 80 70" fill="#d97706" />
            
            {/* Flame */}
            <g style={{ animation: 'flicker-reverse 2.5s ease-in-out infinite' }}>
              <ellipse cx="50" cy="50" rx="15" ry="25" fill="url(#flameGradient2)" opacity="0.9" />
              <ellipse cx="50" cy="55" rx="10" ry="18" fill="#fbbf24" opacity="0.7" />
            </g>
            
            {/* Glow */}
            <circle cx="50" cy="50" r="40" fill="url(#glowGradient2)" opacity="0.3" />
            
            {/* Gradients */}
            <defs>
              <radialGradient id="flameGradient2">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
              <radialGradient id="glowGradient2">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gentle-swing {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes gentle-swing-reverse {
          0%, 100% {
            transform: rotate(3deg);
          }
          50% {
            transform: rotate(-3deg);
          }
        }

        @keyframes flicker {
          0%, 100% {
            transform: scaleY(1) translateY(0);
            opacity: 0.9;
          }
          25% {
            transform: scaleY(1.05) translateY(-2px);
            opacity: 1;
          }
          50% {
            transform: scaleY(0.95) translateY(1px);
            opacity: 0.85;
          }
          75% {
            transform: scaleY(1.02) translateY(-1px);
            opacity: 0.95;
          }
        }

        @keyframes flicker-reverse {
          0%, 100% {
            transform: scaleY(0.95) translateY(1px);
            opacity: 0.85;
          }
          25% {
            transform: scaleY(1.02) translateY(-1px);
            opacity: 0.95;
          }
          50% {
            transform: scaleY(1) translateY(0);
            opacity: 0.9;
          }
          75% {
            transform: scaleY(1.05) translateY(-2px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TempleOpening;
