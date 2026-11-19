import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 3500, // 3.5 seconds per user specification
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

      // Start fade-out 350ms before duration completes
      if (elapsed >= durationMs - 350 && !isExiting) {
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
    }, 200);
  };

  return (
    <div
      role="dialog"
      aria-label="PrepLingo Açılış Ekranı"
      style={{ backgroundColor: '#ECFDF5', color: '#0F172A' }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ECFDF5] text-[#0F172A] select-none transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top-Right "Geç ›" (Skip) Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkip}
          style={{ backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#A7F3D0' }}
          className="px-4 py-1.5 rounded-full bg-[#ffffff] hover:bg-[#d1fae5] active:scale-95 text-xs text-[#0f172a] font-semibold border border-[#a7f3d0] transition-all flex items-center gap-1 cursor-pointer shadow-xs group"
          title="Açılış ekranını geç"
        >
          <span>Geç</span>
          <ChevronRight
            width={14}
            height={14}
            fill="none"
            stroke="#16a34a"
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>

      {/* Subtle Soft-Mint Ambient Glows (Solid HEX + CSS Blur, Zero oklch) */}
      <div
        className="absolute top-1/4 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-60 animate-pulse"
        style={{ backgroundColor: '#D1FAE5' }}
      />
      <div
        className="absolute bottom-1/4 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-60 animate-pulse"
        style={{ backgroundColor: '#A7F3D0' }}
      />

      {/* Main Branding Container */}
      <div className="preplingo-splash-fade relative z-10 flex flex-col items-center text-center px-6 max-w-md mx-auto">
        {/* Prominent Vector SVG Logo with Gentle Float & Pulse */}
        <div className="mb-6 relative">
          <div className="preplingo-splash-float">
            <AppLogo size={108} animate={false} />
          </div>
          <div
            className="absolute -inset-3 rounded-full blur-lg pointer-events-none -z-10 opacity-75 animate-pulse"
            style={{ backgroundColor: '#A7F3D0' }}
          />
        </div>

        {/* Title: "PrepLingo" */}
        <h1 className="font-['Outfit'] font-extrabold text-4xl sm:text-5xl tracking-tight text-[#0F172A]">
          PrepLingo
        </h1>

        {/* Clean, Readable Subtitle Card Directly Under Title */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#A7F3D0',
            boxShadow: '0 8px 24px -6px rgba(16, 185, 129, 0.14)',
          }}
          className="mt-4 px-5 py-3 rounded-2xl bg-[#ffffff] border border-[#a7f3d0] flex items-start gap-2.5 text-center"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#475569] leading-relaxed">
            Üniversite Hazırlık, YDS/IELTS/TOEFL ve Tüm İngilizce Öğrenenler İçin Sözlük &amp; Çalışma Platformu
          </p>
        </div>

        {/* Smooth 0% to 100% Linear Loading Progress Bar */}
        <div className="mt-8 w-56 space-y-2">
          <div
            style={{ backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }}
            className="w-full bg-[#d1fae5] h-2 rounded-full overflow-hidden p-0.5 border border-[#a7f3d0]"
          >
            <div
              style={{ width: `${progress}%`, backgroundColor: '#16A34A' }}
              className="bg-[#16a34a] h-full rounded-full transition-all duration-75 ease-linear"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#475569] font-mono px-0.5">
            <span>Hazırlanıyor...</span>
            <span className="text-[#16a34a] font-bold">%{Math.round(progress)}</span>
          </div>
        </div>

        {/* Subtle Skip Hint */}
        <button
          type="button"
          onClick={handleSkip}
          className="mt-5 text-[11px] font-medium text-[#475569] hover:text-[#16a34a] transition-colors cursor-pointer"
        >
          Beklemek istemiyorsanız dokunun
        </button>
      </div>
    </div>
  );
};
