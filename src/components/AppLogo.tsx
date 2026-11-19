import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 64,
  animate = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${animate ? 'transition-transform duration-300 hover:scale-105' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          {/* Main Vibrant Gradient: Indigo-600 to Purple-600 */}
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>

          {/* Book Pages Inner Gradient */}
          <linearGradient id="book-pages" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E7FF" />
          </linearGradient>

          {/* Golden / Amber Accent Gradient for Graduation Tassel & Spark */}
          <linearGradient id="gold-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Graduation Cap Sleek Dark Indigo Gradient */}
          <linearGradient id="cap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="50%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          {/* Drop shadow filter */}
          <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Squircle Background Base */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="28"
          fill="url(#bg-grad)"
          filter="url(#glow-shadow)"
        />

        {/* Subtle Inner Ring Highlight */}
        <rect
          x="8"
          y="8"
          width="104"
          height="104"
          rx="26"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="2"
        />

        {/* STYLIZED OPEN BOOK EMBLEM */}
        <g transform="translate(18, 48)">
          {/* Book Spine Center Glow */}
          <path
            d="M 42 12 L 42 42"
            stroke="#C7D2FE"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Left Page (Curved Open Academic Leaf) */}
          <path
            d="M 42 14 C 32 8, 16 10, 4 14 C 4 14, 4 38, 4 38 C 16 34, 32 32, 42 38 Z"
            fill="url(#book-pages)"
            fillOpacity="0.95"
            stroke="#EEF2FF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Left Page Text Lines Simulation */}
          <path d="M 12 21 C 20 19, 28 19, 34 21" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 12 27 C 19 25, 27 25, 34 27" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />

          {/* Right Page (Curved Open Academic Leaf) */}
          <path
            d="M 42 14 C 52 8, 68 10, 80 14 C 80 14, 80 38, 80 38 C 68 34, 52 32, 42 38 Z"
            fill="url(#book-pages)"
            fillOpacity="0.95"
            stroke="#EEF2FF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Right Page Text Lines Simulation */}
          <path d="M 50 21 C 56 19, 64 19, 72 21" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 50 27 C 57 25, 65 25, 72 27" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />

          {/* Book Base / Outer Pages Shadow Layer */}
          <path
            d="M 4 38 C 16 36, 32 34, 42 41 C 52 34, 68 36, 80 38 L 80 43 C 68 40, 52 38, 42 45 C 32 38, 16 40, 4 43 Z"
            fill="#312E81"
            fillOpacity="0.6"
          />
        </g>

        {/* GRADUATION CAP EMBLEM (Mortarboard angled gracefully) */}
        <g transform="translate(26, 18)">
          {/* Cap Skull Skull Cap Underneath */}
          <path
            d="M 18 20 C 18 25, 50 25, 50 20 L 50 16 C 50 16, 34 21, 18 16 Z"
            fill="#1E1B4B"
          />

          {/* Mortarboard Diamond Top */}
          <polygon
            points="34,6 64,17 34,28 4,17"
            fill="url(#cap-grad)"
            stroke="#818CF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Center Button on Mortarboard */}
          <circle cx="34" cy="17" r="2.5" fill="url(#gold-accent)" />

          {/* Golden Tassel hanging to right */}
          <path
            d="M 34 17 Q 52 18, 55 28"
            stroke="url(#gold-accent)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Tassel Fringe Bell */}
          <polygon
            points="53,28 57,28 58,35 52,35"
            fill="url(#gold-accent)"
          />
        </g>

        {/* SLEEK GLOWING QUILL & SPARK MOTIF */}
        <g transform="translate(74, 22)">
          {/* Quill Feather Silhouette */}
          <path
            d="M 16 0 C 12 8, 8 16, 0 24 C 6 22, 10 18, 14 14 C 18 10, 19 4, 16 0 Z"
            fill="url(#gold-accent)"
            opacity="0.95"
          />
          {/* Quill Stem */}
          <path
            d="M 16 0 L 0 24"
            stroke="#FFFBEB"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Glowing Spark at Quill Tip */}
          <circle cx="0" cy="24" r="3" fill="#FDE047" className="animate-ping" opacity="0.8" />
          <circle cx="0" cy="24" r="2" fill="#FFFFFF" />

          {/* 4-point Sparkle */}
          <path
            d="M 22 10 L 23.5 14 L 27.5 15.5 L 23.5 17 L 22 21 L 20.5 17 L 16.5 15.5 L 20.5 14 Z"
            fill="#FEF08A"
          />
        </g>
      </svg>
    </div>
  );
};
