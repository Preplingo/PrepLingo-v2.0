import React from 'react';
import { Moon, Sun, Plus, Heart, Info } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  totalWords: number;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
  onOpenAddWord: () => void;
  onOpenAbout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount,
  showOnlyFavorites,
  onToggleFavoritesOnly,
  onOpenAddWord,
  onOpenAbout,
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
              <span className="font-['Outfit'] font-bold text-lg sm:text-xl tracking-tight text-[#0f172a] dark:text-[#f8fafc] shrink-0">
                PrepLingo
              </span>
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

        {/* Right-Side Action Controls: strictly inside the viewport on all screens (360px+) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* PWA Install Button (hidden if already installed or unsupported) */}
          <PWAInstallButton />

          {/* Kelime Defterim Heart Action Button */}
          <button
            type="button"
            onClick={onToggleFavoritesOnly}
            className={`min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
              showOnlyFavorites
                ? 'bg-[#fff1f2] dark:bg-[#4c0519] border-[#fb7185] text-[#be123c] dark:text-[#fda4af] shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#f1f5f9] dark:hover:bg-[#334155]'
            }`}
            title="Kelime Defterim (Favoriler)"
            aria-label="Kelime defterim filtresini aç veya kapat"
          >
            <Heart
              width={16}
              height={16}
              fill={showOnlyFavorites || favoritesCount > 0 ? '#f43f5e' : 'none'}
              stroke={showOnlyFavorites || favoritesCount > 0 ? '#f43f5e' : '#475569'}
              className={`w-4 h-4 transition-transform active:scale-125 ${
                showOnlyFavorites || favoritesCount > 0 ? '' : 'dark:stroke-[#94a3b8]'
              }`}
            />
            <span className="hidden sm:inline text-xs">Defterim</span>
            {favoritesCount > 0 && (
              <span className="text-[11px] font-mono font-bold text-[#e11d48] dark:text-[#fb7185]">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
          </button>

          {/* Add Custom Word Button (Icon on mobile, text on sm+) */}
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
        </div>
      </div>
    </header>
  );
};
