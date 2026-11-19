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
    <header
      style={{
        backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
        borderBottomColor: darkMode ? '#334155' : '#B4C6A6',
      }}
      className="sticky top-0 z-30 w-full bg-[#FFFFFF] dark:bg-[#1E293B] border-b border-[#B4C6A6] dark:border-[#334155] transition-colors overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Wordmark (clean and compact, min-w-0 for long subtitle safety) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            <AppLogo size={34} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-['Outfit'] font-bold text-lg sm:text-xl tracking-tight text-[#0E2F0E] dark:text-[#F8FAFC] shrink-0">
                  PrepLingo
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] leading-none font-mono font-semibold tracking-tight text-[#0E2F0E] dark:text-[#94A3B8] bg-[#E2F0D9] dark:bg-[#0F172A] border border-[#B4C6A6] dark:border-[#334155] shrink-0 select-none">
                  v2.0
                </span>
              </div>
              {/* Subtitle badge: hidden on mobile, visible on sm and up */}
              <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-[#0E2F0E] dark:text-[#FFFFFF] bg-[#C8E6C9] dark:bg-[#059669] px-2.5 py-0.5 rounded-full border border-[#81C784] dark:border-[#10B981] shrink-0">
                AKADEMİK &amp; GENEL SÖZLÜK
              </span>
            </div>
            <p className="text-xs text-[#2D4A2D] dark:text-[#94A3B8] hidden md:block truncate">
              Üniversite Hazırlık, YDS/IELTS/TOEFL ve Tüm İngilizce Öğrenenler İçin Sözlük &amp; Çalışma Platformu
            </p>
          </div>
        </div>

        {/* Right-Side Action Controls: Kelime Ekle, Bilgi, Gece/Gündüz Modu, and animated Coffee button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Add Custom Word Button (Icon on mobile, text on md+) */}
          <button
            type="button"
            onClick={onOpenAddWord}
            className="legacy-btn-green min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] px-2 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#388E3C] hover:bg-[#2E7D32] dark:bg-[#4F46E5] dark:hover:bg-[#3F51B5] active:scale-95 text-[#FFFFFF] border border-[#2E7D32] dark:border-[#3F51B5] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Yeni Kelime Ekle"
            aria-label="Yeni kelime ekle"
          >
            <Plus
              width={16}
              height={16}
              fill="none"
              stroke="#FFFFFF"
              className="w-4 h-4 shrink-0"
            />
            <span className="hidden md:inline text-[#FFFFFF]">Kelime Ekle</span>
          </button>

          {/* About / Info Button */}
          <button
            type="button"
            onClick={onOpenAbout}
            style={{
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor: darkMode ? '#334155' : '#B4C6A6',
            }}
            className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] p-2 rounded-xl text-[#0E2F0E] dark:text-[#F8FAFC] bg-[#FFFFFF] dark:bg-[#0F172A] hover:bg-[#E2F0D9] dark:hover:bg-[#334155] border border-[#B4C6A6] dark:border-[#334155] transition-colors flex items-center justify-center cursor-pointer"
            title="PrepLingo Hakkında"
            aria-label="PrepLingo Hakkında bilgi penceresini aç"
          >
            <Info
              width={16}
              height={16}
              fill="none"
              stroke={darkMode ? '#94A3B8' : '#2E7D32'}
              className="w-4 h-4"
            />
          </button>

          {/* Sleek Day / Night Theme Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            style={{
              backgroundColor: darkMode ? '#0F172A' : '#E2F0D9',
              color: darkMode ? '#F8FAFC' : '#0E2F0E',
              borderColor: darkMode ? '#334155' : '#B4C6A6',
            }}
            className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:px-3 p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title={darkMode ? 'Gündüz Moduna Geç (Fıstık Yeşili)' : 'Gece Moduna Geç (Koyu Mavi)'}
            aria-label={darkMode ? 'Gündüz Moduna Geç' : 'Gece Moduna Geç'}
          >
            {darkMode ? (
              <>
                <Sun width={16} height={16} fill="none" stroke="#FF9800" className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline text-xs font-semibold text-[#F8FAFC]">Gündüz</span>
              </>
            ) : (
              <>
                <Moon width={16} height={16} fill="none" stroke="#0E2F0E" className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline text-xs font-semibold text-[#0E2F0E]">Gece</span>
              </>
            )}
          </button>

          {/* High-Contrast Solid Animated Steaming Coffee Support Button (#E65100 light / #FF9800 dark) */}
          <button
            type="button"
            onClick={onOpenBuyCoffee}
            style={{
              backgroundColor: darkMode ? '#0F172A' : '#FFF3E0',
              borderColor: darkMode ? '#FF9800' : '#E65100',
            }}
            className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] p-1.5 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
            title="Bana Bir Kahve Ismarla"
            aria-label="Bana Bir Kahve Ismarla"
          >
            <SteamingCoffeeIcon
              size={26}
              darkMode={darkMode}
              className="w-6 h-6 sm:w-[26px] sm:h-[26px] shrink-0"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
