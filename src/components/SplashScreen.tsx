import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
  darkMode?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 3000,
  darkMode = false,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    const startTime = performance.now();

    const frame = () => {
      if (hasFinishedRef.current) return;
      const now = performance.now();
      const elapsed = now - startTime;
      const rawPct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(rawPct);

      if (elapsed >= durationMs - 250 && !isExiting) {
        setIsExiting(true);
      }

      if (elapsed >= durationMs) {
        hasFinishedRef.current = true;
        onComplete();
        return;
      }

      requestAnimationFrame(frame);
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [durationMs, onComplete, isExiting]);

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  const bgHex = darkMode ? '#0F172A' : '#E2F0D9';
  const surfaceHex = darkMode ? '#1E293B' : '#FFFFFF';
  const borderHex = darkMode ? '#334155' : '#B4C6A6';
  const textHex = darkMode ? '#F8FAFC' : '#0E2F0E';
  const secondaryTextHex = darkMode ? '#94A3B8' : '#2D4A2D';
  const accentHex = darkMode ? '#4F46E5' : '#388E3C';
  const trackHex = darkMode ? '#1E293B' : '#C8E6C9';

  return (
    <div
      role="dialog"
      aria-label="PrepLingo Açılış Ekranı"
      style={{ backgroundColor: bgHex, color: textHex }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-transform duration-300 ease-out ${
        isExiting ? 'scale-95 pointer-events-none' : 'scale-100'
      }`}
    >
      {/* Top-Right "Geç ›" (Skip) Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkip}
          style={{ backgroundColor: surfaceHex, color: textHex, borderColor: borderHex }}
          className="px-4 py-1.5 rounded-full active:scale-95 text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer group"
          title="Açılış ekranını geç"
        >
          <span>Geç</span>
          <ChevronRight
            width={14}
            height={14}
            fill="none"
            stroke={accentHex}
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>

      {/* Main Branding Container */}
      <div className="preplingo-splash-fade relative z-10 flex flex-col items-center text-center px-6 max-w-md mx-auto">
        {/* Prominent Vector SVG Logo with Gentle Float */}
        <div className="mb-6 relative">
          <div className="preplingo-splash-float">
            <AppLogo size={108} animate={false} />
          </div>
        </div>

        {/* Title: "PrepLingo" */}
        <h1
          style={{ color: textHex }}
          className="font-['Outfit'] font-extrabold text-4xl sm:text-5xl tracking-tight"
        >
          PrepLingo
        </h1>

        {/* Clean, Solid-Bordered Subtitle Card Directly Under Title */}
        <div
          style={{
            backgroundColor: surfaceHex,
            borderColor: borderHex,
          }}
          className="mt-4 px-5 py-3 rounded-2xl border flex items-start gap-2.5 text-center"
        >
          <p
            style={{ color: secondaryTextHex }}
            className="text-xs sm:text-sm font-semibold leading-relaxed"
          >
            Üniversite Hazırlık, YDS/IELTS/TOEFL ve Tüm İngilizce Öğrenenler İçin Sözlük &amp; Çalışma Platformu
          </p>
        </div>

        {/* Smooth 0% to 100% Linear Loading Progress Bar */}
        <div className="mt-8 w-56 space-y-2">
          <div
            style={{ backgroundColor: trackHex, borderColor: borderHex }}
            className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border"
          >
            <div
              style={{ width: `${progress}%`, backgroundColor: accentHex }}
              className="h-full rounded-full transition-all duration-75 ease-linear"
            />
          </div>
          <div
            style={{ color: secondaryTextHex }}
            className="flex items-center justify-between text-[11px] font-mono px-0.5"
          >
            <span>Hazırlanıyor...</span>
            <span style={{ color: accentHex }} className="font-bold">
              %{Math.round(progress)}
            </span>
          </div>
        </div>

        {/* Subtle Skip Hint */}
        <button
          type="button"
          onClick={handleSkip}
          style={{ color: secondaryTextHex }}
          className="mt-5 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          Beklemek istemiyorsanız dokunun
        </button>
      </div>
    </div>
  );
};
