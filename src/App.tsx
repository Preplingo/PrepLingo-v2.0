import React, { useState, useEffect } from 'react';
import { WordEntry, ActiveTab, WordStatus } from './types';
import { INITIAL_WORDS, deduplicateWordEntries } from './data/initialWords';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DictionaryView } from './components/DictionaryView';
import { FlashcardsView } from './components/FlashcardsView';
import { FavoritesView } from './components/FavoritesView';
import { GamesView } from './components/GamesView';
import { ExercisesView } from './components/ExercisesView';
import { AddWordModal } from './components/AddWordModal';
import { AboutModal } from './components/AboutModal';
import { BuyCoffeeModal } from './components/BuyCoffeeModal';
import { SplashScreen } from './components/SplashScreen';
import { OfflineIndicator } from './components/OfflineIndicator';

import { findExactInGeneralDictionary } from './data/generalDictionaryLoader';
import { findInEssentialFallback } from './data/essentialFallback';
import { getCachedOnlineWord } from './utils/onlineDictionary';

const STORAGE_KEY_CUSTOM_WORDS = 'preplingo_custom_words_v1';
const STORAGE_KEY_FAVS = 'preplingo_favs_v2';
const STORAGE_KEY_STATUS = 'preplingo_status_v2';
const STORAGE_KEY_THEME = 'preplingo_theme_v2';
const STORAGE_KEY_HIGHSCORE = 'preplingo_highscore_v2';
const STORAGE_KEY_TIME_ATTACK_BEST = 'preplingo_match_time_attack_best';
const STORAGE_KEY_TIME_ATTACK_BEST_ALT = 'bestTimeAttackScore';
const STORAGE_KEY_CLASSIC_BEST_TIME = 'preplingo_match_classic_best_time';
const STORAGE_KEY_NEW_RECORDS = 'preplingo_new_record_flags_v1';

export interface NewRecordFlags {
  classic: boolean;
  timeAttack: boolean;
}

export default function App() {
  // Animated Splash Screen state - displays for 3s on first load per session
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('preplingo_splash_shown');
      return splashShown !== 'true';
    }
    return false;
  });

  const handleSplashComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('preplingo_splash_shown', 'true');
    }
    setShowSplash(false);
  };

  // Theme state (Light Mode Matte Pistachio #E2F0D9 by default, Dark Mode Deep Navy #0F172A, persisted in localStorage)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
    }
    return false;
  });

  // Apply dark mode class to html root & sync browser theme-color
  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
      if (themeMeta) themeMeta.setAttribute('content', '#0F172A');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
      if (themeMeta) themeMeta.setAttribute('content', '#388E3C');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // High score state for 60s Time Attack match game (synced across legacy & current keys)
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const candidates = [
          localStorage.getItem(STORAGE_KEY_TIME_ATTACK_BEST),
          localStorage.getItem(STORAGE_KEY_TIME_ATTACK_BEST_ALT),
          localStorage.getItem(STORAGE_KEY_HIGHSCORE),
        ]
          .map((v) => (v ? parseInt(v, 10) : 0))
          .filter((n) => Number.isFinite(n) && n > 0);
        return candidates.length > 0 ? Math.max(...candidates) : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });

  // Best completion time (in seconds) for Classic 6-word match game
  const [classicBestTime, setClassicBestTime] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CLASSIC_BEST_TIME);
        if (!saved) return null;
        const parsed = parseInt(saved, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Track newly broken records so Gelişim tab & game screen can celebrate them
  const [newRecordFlags, setNewRecordFlags] = useState<NewRecordFlags>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_NEW_RECORDS);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            classic: Boolean(parsed?.classic),
            timeAttack: Boolean(parsed?.timeAttack),
          };
        }
      } catch {
        // ignore
      }
    }
    return { classic: false, timeAttack: false };
  });

  // Ultra-fast word state management: merges static JSON with custom words and localized progress
  const [words, setWords] = useState<WordEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS);
        const savedFavs = localStorage.getItem(STORAGE_KEY_FAVS);
        const savedStatus = localStorage.getItem(STORAGE_KEY_STATUS);

        const customWords: WordEntry[] = savedCustom ? JSON.parse(savedCustom) : [];
        const favSet = new Set(savedFavs ? JSON.parse(savedFavs) : []);
        const statusMap: Record<string, WordStatus> = savedStatus ? JSON.parse(savedStatus) : {};

        // App-Level Shield: filter duplicates and keep the richest entry
        const mergedWords = deduplicateWordEntries([...customWords, ...INITIAL_WORDS]);

        return mergedWords.map((w: WordEntry) => ({
          ...w,
          isFavorite: favSet.has(w.id) || w.isFavorite,
          status: statusMap[w.id] || w.status || 'calisiliyor',
        }));
      } catch (e) {
        console.error('Error loading initial words:', e);
      }
    }
    return deduplicateWordEntries(INITIAL_WORDS).map((w) => ({
      ...w,
      status: 'calisiliyor' as WordStatus,
    }));
  });

  // Active Bottom Nav Tab: 'dictionary' | 'flashcards' | 'favorites' | 'games' | 'exercises'
  const [activeTab, setActiveTab] = useState<ActiveTab>('dictionary');
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [practiceWordId, setPracticeWordId] = useState<string | undefined>(undefined);

  // Sync favorites to localStorage with O(1) set operations
  const handleToggleFavorite = (id: string, fallbackEntry?: WordEntry) => {
    setWords((prev) => {
      const exists = prev.some((w) => w.id === id);
      let updated: WordEntry[];
      if (exists) {
        updated = prev.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
      } else {
        const cleanWord = id.replace(/^(ess|gen|online|elem)_/, '').replace(/_/g, ' ');
        const rawKey = id.replace(/^(ess|gen|online|elem)_/, '');
        const resolvedWord =
          fallbackEntry ||
          findInEssentialFallback(cleanWord) ||
          findInEssentialFallback(rawKey) ||
          getCachedOnlineWord(cleanWord) ||
          getCachedOnlineWord(rawKey) ||
          findExactInGeneralDictionary(cleanWord) ||
          findExactInGeneralDictionary(rawKey);
        if (resolvedWord) {
          const entryToAdd: WordEntry = { ...resolvedWord, id: resolvedWord.id || id, isFavorite: true };
          updated = deduplicateWordEntries([entryToAdd, ...prev]);
          if (fallbackEntry) {
            try {
              const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS);
              const customList: WordEntry[] = savedCustom ? JSON.parse(savedCustom) : [];
              const updatedCustom = deduplicateWordEntries([entryToAdd, ...customList]);
              localStorage.setItem(STORAGE_KEY_CUSTOM_WORDS, JSON.stringify(updatedCustom));
            } catch {
              // ignore
            }
          }
        } else {
          updated = prev;
        }
      }
      const favIds = updated.filter((w) => w.isFavorite).map((w) => w.id);
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favIds));
      return updated;
    });
  };

  // Batch-add multiple words to Defterim (favorites) without toggling off existing favorites
  const handleAddWordsToFavorites = (wordIds: string[], fallbackEntries?: WordEntry[]) => {
    if (!wordIds || wordIds.length === 0) return;
    const idSet = new Set(wordIds);
    setWords((prev) => {
      const existingIds = new Set(prev.map((w) => w.id));
      const newFallbacks = (fallbackEntries || [])
        .filter((entry) => idSet.has(entry.id) && !existingIds.has(entry.id))
        .map((entry) => ({ ...entry, isFavorite: true }));

      let updated = prev.map((w) => (idSet.has(w.id) ? { ...w, isFavorite: true } : w));
      if (newFallbacks.length > 0) {
        updated = deduplicateWordEntries([...newFallbacks, ...updated]);
        try {
          const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS);
          const customList: WordEntry[] = savedCustom ? JSON.parse(savedCustom) : [];
          const updatedCustom = deduplicateWordEntries([...newFallbacks, ...customList]);
          localStorage.setItem(STORAGE_KEY_CUSTOM_WORDS, JSON.stringify(updatedCustom));
        } catch {
          // ignore
        }
      }
      const favIds = updated.filter((w) => w.isFavorite).map((w) => w.id);
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favIds));
      return updated;
    });
  };

  // Update status: 'ogrenildi' (Mastered) vs 'calisiliyor' (Learning) with lightweight key-value map
  const handleUpdateStatus = (id: string, newStatus: WordStatus) => {
    setWords((prev) => {
      const exists = prev.some((w) => w.id === id);
      let updated: WordEntry[];
      if (exists) {
        updated = prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w));
      } else {
        const cleanWord = id.replace(/^(ess|gen|online)_/, '').replace(/_/g, ' ');
        const rawKey = id.replace(/^(ess|gen|online)_/, '');
        const fallbackWord =
          findInEssentialFallback(cleanWord) ||
          findInEssentialFallback(rawKey) ||
          getCachedOnlineWord(cleanWord) ||
          getCachedOnlineWord(rawKey) ||
          findExactInGeneralDictionary(cleanWord) ||
          findExactInGeneralDictionary(rawKey);
        if (fallbackWord) {
          updated = deduplicateWordEntries([{ ...fallbackWord, status: newStatus }, ...prev]);
        } else {
          updated = prev;
        }
      }
      const statusMap: Record<string, WordStatus> = {};
      updated.forEach((w) => {
        if (w.status) statusMap[w.id] = w.status;
      });
      localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(statusMap));
      return updated;
    });
  };

  // Custom word added by user is stored separately to scale seamlessly to 1000+ words
  const handleAddWord = (newWord: WordEntry) => {
    setWords((prev) => deduplicateWordEntries([newWord, ...prev]));
    try {
      const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_WORDS);
      const customList: WordEntry[] = savedCustom ? JSON.parse(savedCustom) : [];
      const updatedCustom = deduplicateWordEntries([newWord, ...customList]);
      localStorage.setItem(STORAGE_KEY_CUSTOM_WORDS, JSON.stringify(updatedCustom));
    } catch (e) {
      console.error('Error saving custom word:', e);
    }
  };

  const persistNewRecordFlags = (updated: NewRecordFlags) => {
    try {
      localStorage.setItem(STORAGE_KEY_NEW_RECORDS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Classic 6-word match completion: update fastest completion time record (lower is better)
  const handleClassicComplete = (elapsedSeconds: number): boolean => {
    const validSeconds = Math.max(1, Math.round(elapsedSeconds));
    const isNewRecord = classicBestTime === null || validSeconds < classicBestTime;
    if (isNewRecord) {
      setClassicBestTime(validSeconds);
      try {
        localStorage.setItem(STORAGE_KEY_CLASSIC_BEST_TIME, validSeconds.toString());
      } catch {
        // ignore
      }
      setNewRecordFlags((prev) => {
        const updated = { ...prev, classic: true };
        persistNewRecordFlags(updated);
        return updated;
      });
    }
    return isNewRecord;
  };

  // 60s Time Attack completion: update highest score record
  const handleTimeAttackComplete = (finalScore: number): boolean => {
    const isNewRecord = finalScore > 0 && finalScore > highScore;
    if (isNewRecord) {
      setHighScore(finalScore);
      try {
        localStorage.setItem(STORAGE_KEY_HIGHSCORE, finalScore.toString());
        localStorage.setItem(STORAGE_KEY_TIME_ATTACK_BEST, finalScore.toString());
        localStorage.setItem(STORAGE_KEY_TIME_ATTACK_BEST_ALT, finalScore.toString());
      } catch {
        // ignore
      }
      setNewRecordFlags((prev) => {
        const updated = { ...prev, timeAttack: true };
        persistNewRecordFlags(updated);
        return updated;
      });
    }
    return isNewRecord;
  };

  const handleClearNewRecordFlags = () => {
    setNewRecordFlags((prev) => {
      if (!prev.classic && !prev.timeAttack) return prev;
      const cleared = { classic: false, timeAttack: false };
      persistNewRecordFlags(cleared);
      return cleared;
    });
  };

  // Shortcut from Dictionary: practice a specific word in speaking check
  const handlePracticeWord = (word: WordEntry) => {
    setPracticeWordId(word.id);
    setActiveTab('games');
  };

  const favoritesCount = words.filter((w) => w.isFavorite).length;

  return (
    <div
      style={{
        backgroundColor: darkMode ? '#0F172A' : '#E2F0D9',
        color: darkMode ? '#F8FAFC' : '#0E2F0E',
      }}
      className="min-h-screen overflow-x-hidden bg-[#E2F0D9] dark:bg-[#0F172A] text-[#0E2F0E] dark:text-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors"
    >
      {/* Animated Splash Screen on first load (3s) */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} durationMs={3000} darkMode={darkMode} />}

      {/* Top Header */}
      <Header
        onOpenAddWord={() => setIsAddWordOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenBuyCoffee={() => setIsCoffeeModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <OfflineIndicator />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dictionary' && (
          <DictionaryView
            words={words}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
            onPracticeWord={handlePracticeWord}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            words={words}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            words={words}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
            onPracticeWord={handlePracticeWord}
            onNavigateToDictionary={() => setActiveTab('dictionary')}
            highScore={highScore}
            classicBestTime={classicBestTime}
            newRecordFlags={newRecordFlags}
            onClearNewRecordFlags={handleClearNewRecordFlags}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'games' && (
          <GamesView
            words={words}
            initialWordId={practiceWordId}
            timeAttackBest={highScore}
            classicBestTime={classicBestTime}
            newRecordFlags={newRecordFlags}
            onClassicComplete={handleClassicComplete}
            onTimeAttackComplete={handleTimeAttackComplete}
            onNavigateToDictionary={() => setActiveTab('dictionary')}
            onNavigateToFlashcards={() => setActiveTab('flashcards')}
            onAddWordsToFavorites={handleAddWordsToFavorites}
          />
        )}

        {activeTab === 'exercises' && (
          <ExercisesView
            words={words}
            onToggleFavorite={handleToggleFavorite}
            onAddWordsToFavorites={handleAddWordsToFavorites}
          />
        )}
      </main>

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
        onAddWord={handleAddWord}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Buy Me a Coffee Modal */}
      <BuyCoffeeModal
        isOpen={isCoffeeModalOpen}
        onClose={() => setIsCoffeeModalOpen(false)}
        darkMode={darkMode}
      />

      {/* Material 3 Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        favoritesCount={favoritesCount}
      />
    </div>
  );
}
