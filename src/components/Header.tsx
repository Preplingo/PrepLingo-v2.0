import React from 'react';
import { Moon, Sun, Plus, Info } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { SteamingCoffeeIcon } from './BuyCoffeeModal';

interface HeaderProps {
  onOpenAddWord: () => void;
  onOpenAbout: () => void;
  onOpenBuyCoffee: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddWord,
  onOpenAbout,
  onOpenBuyCoffee,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#ffffff] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] shadow-2xs transition-colors overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Wordmark (clean and compact, min-w-0 for long subtitle safety) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            <AppLogo size={34} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-['Outfit'] font-bold text-lg sm:text-xl tracking-tight text-[#0f172a] dark:text-[#f8fafc] shrink-0">
                  PrepLingo
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] leading-none font-mono font-semibold tracking-tight text-[#475569] dark:text-[#94a3b8] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] shrink-0 select-none">
                  v2.0
                </span>
              </div>
              {/* Subtitle badge: hidden on mobile, visible on sm and up */}
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-[#047857] dark:text-[#6ee7b7] bg-[#ecfdf5] dark:bg-[#064e3b] px-2.5 py-0.5 rounded-full border border-[#a7f3d0] dark:border-[#059669] shrink-0">
                AKADEMİK &amp; GENEL SÖZLÜK
              </span>
            </div>
            <p className="text-xs text-[#475569] dark:text-[#94a3b8] hidden md:block truncate">
              Üniversite Hazırlık, YDS/IELTS/TOEFL ve Tüm İngilizce Öğrenenler İçin Sözlük &amp; Çalışma Platformu
            </p>
          </div>
        </div>

        {/* Right-Side Action Controls: Kelime Ekle, Gece/Gündüz Modu, and animated Coffee button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Custom Word Button (Icon on mobile, text on md+) */}
          <button
            type="button"
            onClick={onOpenAddWord}
            style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
            className="legacy-btn-green min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] px-2 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] border border-[#15803d] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Yeni Kelime Ekle"
            aria-label="Yeni kelime ekle"
          >
            <Plus
              width={16}
              height={16}
              fill="none"
              stroke="#ffffff"
              className="w-4 h-4 shrink-0"
            />
            <span className="hidden md:inline" style={{ color: '#ffffff' }}>Kelime Ekle</span>
          </button>

          {/* About / Info Button */}
          <button
            type="button"
            onClick={onOpenAbout}
            className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] p-2 rounded-xl text-[#475569] dark:text-[#f8fafc] bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155] transition-colors flex items-center justify-center cursor-pointer"
            title="PrepLingo Hakkında"
            aria-label="PrepLingo Hakkında bilgi penceresini aç"
          >
            <Info
              width={16}
              height={16}
              fill="none"
              stroke="#4f46e5"
              className="w-4 h-4 dark:stroke-[#818cf8]"
            />
          </button>

          {/* Sleek Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            style={{
              backgroundColor: darkMode ? '#0f172a' : '#ecfdf5',
              color: darkMode ? '#f8fafc' : '#0f172a',
              borderColor: darkMode ? '#334155' : '#a7f3d0',
            }}
            className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:px-3 p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title={darkMode ? 'Gündüz Moduna Geç (Yumuşak Nane)' : 'Gece Moduna Geç (Koyu Arduvaz)'}
            aria-label={darkMode ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          >
            {darkMode ? (
              <>
                <Sun width={16} height={16} fill="none" stroke="#fbbf24" className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline text-xs font-semibold text-[#f8fafc]">Gündüz</span>
              </>
            ) : (
              <>
                <Moon width={16} height={16} fill="none" stroke="#0f172a" className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline text-xs font-semibold text-[#0f172a]">Gece</span>
              </>
            )}
          </button>

          {/* Warm Amber/Orange Animated Steaming Coffee Support Button */}
          <button
            type="button"
            onClick={onOpenBuyCoffee}
            style={{
              backgroundColor: darkMode ? '#451a03' : '#fffbeb',
              borderColor: darkMode ? '#d97706' : '#fbbf24',
            }}
            className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-1.5 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Bana Bir Kahve Ismarla"
            aria-label="Bana Bir Kahve Ismarla"
          >
            <SteamingCoffeeIcon size={26} className="w-6 h-6 sm:w-[26px] sm:h-[26px] shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
