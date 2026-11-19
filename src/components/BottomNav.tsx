import React from 'react';
import { BookOpen, Layers, Heart, Zap, FilePenLine } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  favoritesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, favoritesCount }) => {
  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{
      className?: string;
      width?: number | string;
      height?: number | string;
      fill?: string;
      stroke?: string;
    }>;
  }[] = [
    { id: 'dictionary', label: 'Sözlük', icon: BookOpen },
    { id: 'flashcards', label: 'Kartlar', icon: Layers },
    { id: 'favorites', label: 'Defterim', icon: Heart },
    { id: 'games', label: 'Oyun', icon: Zap },
    { id: 'exercises', label: 'Alıştırmalar', icon: FilePenLine },
  ];

  return (
    <nav
      aria-label="Alt Menü Gezintisi"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#1E293B] border-t border-[#B4C6A6] dark:border-[#334155] transition-colors"
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-1.5 sm:px-2 h-16 flex items-center justify-between gap-0.5 sm:gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 min-w-0 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 sm:px-2 rounded-2xl transition-all select-none group cursor-pointer"
            >
              {/* Solid High-Contrast Active Pill (#388E3C Light / #4F46E5 Dark) */}
              <div
                className={`relative flex items-center justify-center px-3 sm:px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'legacy-btn-green bg-[#388E3C] dark:bg-[#4F46E5] text-[#FFFFFF] border border-[#2E7D32] dark:border-[#3F51B5]'
                    : 'text-[#2D4A2D] dark:text-[#94A3B8] group-hover:bg-[#E2F0D9] dark:group-hover:bg-[#0F172A]'
                }`}
              >
                <Icon
                  width={20}
                  height={20}
                  fill="none"
                  stroke={isActive ? '#FFFFFF' : '#2D4A2D'}
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-105' : 'group-hover:scale-105 dark:stroke-[#94A3B8]'
                  }`}
                />
                {tab.id === 'favorites' && typeof favoritesCount === 'number' && favoritesCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono tabular-nums border ${
                      isActive
                        ? 'bg-[#FFFFFF] text-[#2E7D32] dark:text-[#4F46E5] border-[#2E7D32] dark:border-[#3F51B5]'
                        : 'bg-[#E11D48] text-[#FFFFFF] border-[#BE123C]'
                    }`}
                  >
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap truncate max-w-full transition-colors ${
                  isActive
                    ? 'text-[#2E7D32] dark:text-[#F8FAFC] font-bold'
                    : 'text-[#2D4A2D] dark:text-[#94A3B8]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
