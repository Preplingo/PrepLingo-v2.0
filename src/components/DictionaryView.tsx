import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Volume2,
  Bookmark,
  Heart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Mic,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowRight,
  BookA,
  Globe,
  Loader2,
  WifiOff
} from 'lucide-react';
import { WordEntry, CefrFilter, PosFilter, WordStatus } from '../types';
import { fastMatchWord, getWordSearchIndex, normalizeForSearch } from '../utils/turkishSearch';
import { speakText } from '../utils/textToSpeech';
import { getCefrBadgeClass, getPosBadgeClass, getPosTurkishLabel } from '../utils/themeBadges';
import { VerbConjugationBadge } from '../utils/verbConjugation';
import {
  generalDictionary,
  searchGeneralDictionary,
  ensureGeneralDictionaryLoaded,
} from '../data/generalDictionaryLoader';
import { searchEssentialFallback } from '../data/essentialFallback';
import { lookupOnlineDictionary, getCachedOnlineWord } from '../utils/onlineDictionary';
import { compareWordsAlphabetically } from '../data/initialWords';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const matchesPartOfSpeechFilter = (item: WordEntry, filter: PosFilter): boolean => {
  if (filter === 'all') return true;
  const pos = item.partOfSpeech;
  const type = item.type;
  if (pos === filter || type === filter) return true;
  if (filter === 'adjective') return pos === 'adj' || type === 'adj';
  if (filter === 'adverb') return pos === 'adv' || type === 'adv';
  return false;
};

const getSearchMatchPriority = (
  item: WordEntry,
  queryLower: string,
  normQuery: string
): number => {
  const index = getWordSearchIndex(item);
  const wordTrimmedLower = item.word.trim().toLowerCase();
  const meaningTrimmedLower = item.trMeaning.trim().toLowerCase();

  // 1. Exact English word match
  if (wordTrimmedLower === queryLower) return 100;
  // 2. Normalized exact English word match
  if (normQuery && index.wordNorm === normQuery) return 95;
  // 3. Exact Turkish meaning match (full or comma/semicolon-separated sense)
  if (
    meaningTrimmedLower === queryLower ||
    meaningTrimmedLower.split(/[,;]/).some((part) => part.trim() === queryLower)
  ) {
    return 90;
  }
  // 4. English word starts with query
  if (wordTrimmedLower.startsWith(queryLower)) return 80;
  // 5. Normalized English word starts with normalized query
  if (normQuery && index.wordNorm.startsWith(normQuery)) return 75;
  // 6. Turkish meaning starts with query
  if (
    meaningTrimmedLower.startsWith(queryLower) ||
    (normQuery && index.meaningNorm.startsWith(normQuery))
  ) {
    return 65;
  }
  // 7. English word contains query
  if (wordTrimmedLower.includes(queryLower) || (normQuery && index.wordNorm.includes(normQuery))) {
    return 50;
  }
  // 8. Turkish meaning contains query
  if (meaningTrimmedLower.includes(queryLower) || (normQuery && index.meaningNorm.includes(normQuery))) {
    return 40;
  }
  // 9. Example sentence or collocation match
  return 20;
};

interface DictionaryViewProps {
  words: WordEntry[];
  onToggleFavorite: (id: string) => void;
  onUpdateStatus?: (id: string, status: WordStatus) => void;
  onPracticeWord?: (word: WordEntry) => void;
}

const getPosAbbr = (pos: string) => {
  switch (pos) {
    case 'noun': return 'n';
    case 'verb': return 'v';
    case 'adjective': return 'adj';
    case 'adverb': return 'adv';
    default: return pos;
  }
};

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  words,
  onToggleFavorite,
  onUpdateStatus,
  onPracticeWord,
}) => {
  // View mode switcher: standard (Sözlük Arama) vs directory (A-Z Dizin)
  const [viewMode, setViewMode] = useState<'standard' | 'directory'>('standard');

  // Track lazy load state of the general dictionary
  const [isGeneralDictLoaded, setIsGeneralDictLoaded] = useState(() => generalDictionary.getIsLoaded());

  useEffect(() => {
    return generalDictionary.subscribe(() => {
      setIsGeneralDictLoaded(true);
    });
  }, []);

  // Directory Mode states: default Part of Speech is 'verb' (Fiil) as requested
  const [directoryPos, setDirectoryPos] = useState<PosFilter>('verb');
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [expandedDirCardId, setExpandedDirCardId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cefrFilter, setCefrFilter] = useState<CefrFilter>('Tümü');
  const [posFilter, setPosFilter] = useState<PosFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ogrenildi' | 'calisiliyor'>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Tier 3 Online Dictionary Fallback states
  const [onlineResults, setOnlineResults] = useState<WordEntry[]>([]);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);
  const [onlineErrorReason, setOnlineErrorReason] = useState<'offline' | 'not_found' | 'network_error' | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [searchSubmitCount, setSearchSubmitCount] = useState(0);
  const forceImmediateRef = useRef(false);

  // Progressive batch rendering for scaling smoothly to 1000+ words
  const [visibleBatchCount, setVisibleBatchCount] = useState(30);

  // Autocomplete dropdown & keyboard friendly states
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track live browser online/offline state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset pagination batch count when search or filters change
  useEffect(() => {
    setVisibleBatchCount(30);
  }, [searchQuery, cefrFilter, posFilter, statusFilter]);

  // Compute word counts per letter for the alphabet selector given the current directory POS filter
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const char of ALPHABET) {
      counts[char] = 0;
    }
    for (const w of words) {
      if (!matchesPartOfSpeechFilter(w, directoryPos)) continue;
      const firstChar = w.word.trim().charAt(0).toUpperCase();
      if (counts[firstChar] !== undefined) {
        counts[firstChar]++;
      }
    }
    return counts;
  }, [words, directoryPos]);

  // Words matching the selected letter and directory POS filter (always strictly A-Z)
  const directoryWords = useMemo(() => {
    return words
      .filter((w) => {
        if (!matchesPartOfSpeechFilter(w, directoryPos)) return false;
        return w.word.trim().toUpperCase().startsWith(selectedLetter);
      })
      .sort(compareWordsAlphabetically);
  }, [words, directoryPos, selectedLetter]);

  // Generate top 5 autocomplete candidate suggestions with indexed prefix matching.
  // First searches the primary rich prep dataset; backfills with secondary general dictionary if fewer than 5.
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const normQuery = normalizeForSearch(query);

    const scored = words
      .map((word) => {
        const index = getWordSearchIndex(word);

        let score = 0;
        if (index.wordLower === query) score = 100;
        else if (index.wordLower.startsWith(query)) score = 85;
        else if (index.wordNorm.startsWith(normQuery)) score = 80;
        else if (index.meaningLower.startsWith(query) || index.meaningNorm.startsWith(normQuery)) score = 75;
        else if (index.wordNorm.includes(normQuery)) score = 55;
        else if (index.meaningNorm.includes(normQuery)) score = 45;

        return { word, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || compareWordsAlphabetically(a.word, b.word));

    const primaryResults = scored.slice(0, 5).map((item) => item.word);
    const seenWords = new Set(primaryResults.map((w) => w.word.toLowerCase()));

    // 1. If fewer than 5 primary suggestions, backfill from essential fallback dataset
    if (primaryResults.length < 5) {
      const needed = 5 - primaryResults.length;
      const essentialMatches = searchEssentialFallback(query, needed + 5);

      for (const essWord of essentialMatches) {
        if (!seenWords.has(essWord.word.toLowerCase())) {
          seenWords.add(essWord.word.toLowerCase());
          primaryResults.push(essWord);
          if (primaryResults.length >= 5) break;
        }
      }
    }

    // 2. If still fewer than 5 primary suggestions, backfill from secondary compact general dictionary
    if (primaryResults.length < 5) {
      const needed = 5 - primaryResults.length;
      const generalMatches = searchGeneralDictionary(query, needed + 5);

      for (const genWord of generalMatches) {
        if (!seenWords.has(genWord.word.toLowerCase())) {
          seenWords.add(genWord.word.toLowerCase());
          primaryResults.push(genWord);
          if (primaryResults.length >= 5) break;
        }
      }
    }

    return primaryResults;
  }, [words, searchQuery, isGeneralDictLoaded]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Explicit Search Submit handler (Arrow button click or mobile/desktop Enter key)
  const handleExplicitSearch = () => {
    setShowSuggestions(false);
    setIsInputFocused(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.blur();
    ensureGeneralDictionaryLoaded();

    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2 && !hasExactLocalMatch) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOnline(false);
        setOnlineResults([]);
        setIsOnlineLoading(false);
        setOnlineErrorReason('offline');
        return;
      }
      forceImmediateRef.current = true;
      setSearchSubmitCount((prev) => prev + 1);
    }
  };

  // Keyboard navigation within suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0 && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        e.preventDefault();
        handleExplicitSearch();
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  };

  // Handle selecting an autocomplete suggestion item
  const handleSelectSuggestion = (word: WordEntry) => {
    setSearchQuery(word.word);
    setShowSuggestions(false);
    setIsInputFocused(false);
    setActiveSuggestionIndex(-1);

    // Dismiss virtual keyboard on mobile so screen isn't obstructed
    inputRef.current?.blur();

    // Reset filters if they would hide the chosen card
    if (word.isGeneralDict || word.cefrLevel === 'Genel') {
      setCefrFilter('Tümü');
    } else if (cefrFilter === 'A1-A2' && (word.cefrLevel === 'B1' || word.cefrLevel === 'B2')) {
      setCefrFilter('Tümü');
    } else if (cefrFilter === 'B1-B2' && (word.cefrLevel === 'A1' || word.cefrLevel === 'A2')) {
      setCefrFilter('Tümü');
    }

    if (posFilter !== 'all' && word.partOfSpeech !== posFilter) {
      setPosFilter('all');
    }

    if (statusFilter !== 'all' && word.status !== statusFilter) {
      setStatusFilter('all');
    }

    // Ensure selected card is within the rendered progressive slice
    const targetIdx = words.findIndex((w) => w.id === word.id);
    if (targetIdx >= visibleBatchCount) {
      setVisibleBatchCount(targetIdx + 20);
    }

    // Scroll to & highlight the selected card
    setHighlightedWordId(word.id);

    setTimeout(() => {
      const cardEl = document.getElementById(`word-card-${word.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    setTimeout(() => {
      setHighlightedWordId(null);
    }, 2800);
  };

  // 3-Tier Search Pipeline:
  // Tier 1: Search dictionaryData.json (+ essentialFallback merged into words).
  // Tier 2: Search essentialFallback and generalDictionary.json whenever exact word match isn't in Tier 1.
  const { localMatches, isFromGeneralDict } = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const trimmedLower = trimmedQuery.toLowerCase();

    // Tier 1: Primary rich prep search
    const primaryMatches = words.filter((item) => {
      // CEFR Filter (supports grouped A1-A2/B1-B2 and any individual CEFR level)
      if (cefrFilter !== 'Tümü') {
        if (cefrFilter === 'A1-A2') {
          if (item.cefrLevel !== 'A1' && item.cefrLevel !== 'A2') return false;
        } else if (cefrFilter === 'B1-B2') {
          if (item.cefrLevel !== 'B1' && item.cefrLevel !== 'B2') return false;
        } else if (item.cefrLevel !== cefrFilter) {
          return false;
        }
      }

      // Part of speech filter
      if (!matchesPartOfSpeechFilter(item, posFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }

      // Fast pre-indexed tokenized search query matching (< 0.5ms on 1000+ words)
      if (trimmedQuery) {
        return fastMatchWord(item, trimmedQuery);
      }

      return true;
    });

    if (!trimmedQuery) {
      return { localMatches: primaryMatches, isFromGeneralDict: false };
    }

    const primaryHasExact = primaryMatches.some(
      (w) => w.word.toLowerCase().trim() === trimmedLower
    );

    if (primaryHasExact) {
      return { localMatches: primaryMatches, isFromGeneralDict: false };
    }

    // Tier 2a: Essential everyday & academic fallback search (synchronous, instant)
    const essentialMatches = searchEssentialFallback(trimmedQuery, 40).filter((item) =>
      matchesPartOfSpeechFilter(item, posFilter)
    );

    const essentialHasExact = essentialMatches.some(
      (w) => w.word.toLowerCase().trim() === trimmedLower
    );

    if (essentialHasExact) {
      const seen = new Set(essentialMatches.map((w) => w.word.toLowerCase().trim()));
      const merged = [
        ...essentialMatches,
        ...primaryMatches.filter((w) => !seen.has(w.word.toLowerCase().trim())),
      ];
      return { localMatches: merged, isFromGeneralDict: false };
    }

    // Tier 2b: Secondary compact general dataset (30,000+ words)
    const generalMatches = searchGeneralDictionary(trimmedQuery, 40).filter((item) =>
      matchesPartOfSpeechFilter(item, posFilter)
    );

    const generalExactMatches = generalMatches.filter(
      (w) => w.word.toLowerCase().trim() === trimmedLower
    );

    if (generalExactMatches.length > 0) {
      const seen = new Set(generalMatches.map((w) => w.word.toLowerCase().trim()));
      const merged = [
        ...generalMatches,
        ...essentialMatches.filter((w) => !seen.has(w.word.toLowerCase().trim())),
        ...primaryMatches.filter((w) => !seen.has(w.word.toLowerCase().trim())),
      ];
      return {
        localMatches: merged,
        isFromGeneralDict: primaryMatches.length === 0 && essentialMatches.length === 0,
      };
    }

    if (primaryMatches.length > 0) {
      return { localMatches: primaryMatches, isFromGeneralDict: false };
    }

    if (essentialMatches.length > 0) {
      return { localMatches: essentialMatches, isFromGeneralDict: false };
    }

    return {
      localMatches: generalMatches,
      isFromGeneralDict: generalMatches.length > 0,
    };
  }, [words, cefrFilter, posFilter, statusFilter, searchQuery, isGeneralDictLoaded]);

  // Exact local word match check (ignores partial/example-sentence substring matches like "publicly" inside "repudiate")
  const hasExactLocalMatch = useMemo(() => {
    const trimmedLower = searchQuery.toLowerCase().trim();
    if (!trimmedLower) return false;
    return localMatches.some((w) => w.word.toLowerCase().trim() === trimmedLower);
  }, [localMatches, searchQuery]);

  // Tier 3: Automatic Online Lookup (500ms debounced on typing, 0ms on Search Button / Enter)
  // Triggered whenever a searched word (min 2 chars) has NO exact local match.
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (viewMode !== 'standard' || trimmedQuery.length < 2 || hasExactLocalMatch) {
      forceImmediateRef.current = false;
      setOnlineResults([]);
      setIsOnlineLoading(false);
      setOnlineErrorReason(null);
      return;
    }

    // Ensure Tier 2 generalDictionary finishes loading before falling back to Tier 3 online API
    if (!isGeneralDictLoaded) {
      ensureGeneralDictionaryLoaded();
      return;
    }

    // Check memory/session cache synchronously for instant re-search
    const cached = getCachedOnlineWord(trimmedQuery);
    if (cached) {
      forceImmediateRef.current = false;
      setOnlineResults([cached]);
      setIsOnlineLoading(false);
      setOnlineErrorReason(null);
      return;
    }

    // Graceful offline detection before querying external API
    const currentlyOffline = !isOnline || (typeof navigator !== 'undefined' && navigator.onLine === false);
    if (currentlyOffline) {
      forceImmediateRef.current = false;
      setOnlineResults([]);
      setIsOnlineLoading(false);
      setOnlineErrorReason('offline');
      return;
    }

    const isImmediate = forceImmediateRef.current;
    forceImmediateRef.current = false;

    const controller = new AbortController();
    setIsOnlineLoading(true);
    setOnlineErrorReason(null);
    setOnlineResults([]);

    const debounceTimer = setTimeout(async () => {
      const response = await lookupOnlineDictionary(trimmedQuery, controller.signal);
      if (controller.signal.aborted) return;

      setIsOnlineLoading(false);
      if (response.result) {
        setOnlineResults([response.result]);
        setOnlineErrorReason(null);
      } else {
        setOnlineResults([]);
        setOnlineErrorReason(
          response.status === 'offline' || response.status === 'network_error'
            ? response.status
            : 'not_found'
        );
      }
    }, isImmediate ? 0 : 500);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchQuery, hasExactLocalMatch, isGeneralDictLoaded, viewMode, isOnline, searchSubmitCount]);

  // Final render-ready list:
  // - Empty search query -> strictly sorted A-Z by English word at the very last step before returning
  //   (no isFavorite, isCustom, isFeatured, isNew, priority, id, or insertion-order overrides)
  // - Active search query -> sorted by match priority (exact match, word prefix, etc.) with A-Z tie-breaker
  const filteredWords = useMemo(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      const sorted = [...localMatches];
      sorted.sort((a, b) =>
        a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' })
      );
      return sorted;
    }

    const queryLower = trimmedQuery.toLowerCase();
    const normQuery = normalizeForSearch(trimmedQuery);

    const sortBySearchPriority = (list: WordEntry[]) =>
      [...list].sort((a, b) => {
        const priorityDiff =
          getSearchMatchPriority(b, queryLower, normQuery) -
          getSearchMatchPriority(a, queryLower, normQuery);
        if (priorityDiff !== 0) return priorityDiff;
        return a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' });
      });

    if (onlineResults.length > 0 && !hasExactLocalMatch) {
      const onlineWordSet = new Set(onlineResults.map((w) => w.word.toLowerCase().trim()));
      const remainingLocal = localMatches.filter(
        (w) => !onlineWordSet.has(w.word.toLowerCase().trim())
      );
      return [...onlineResults, ...sortBySearchPriority(remainingLocal)];
    }

    return sortBySearchPriority(localMatches);
  }, [localMatches, onlineResults, hasExactLocalMatch, searchQuery]);

  const isFromOnlineDict = onlineResults.length > 0 && !hasExactLocalMatch;

  // Pronunciation handler - ONLY used for English target words and English example sentences
  const handleSpeakEnglish = (text: string, id: string) => {
    setSpeakingId(id);
    speakText(text, 'en-US', 1.0, () => {
      setSpeakingId(null);
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* View Switcher: Sözlük Arama vs A-Z Dizin (Fihrist) */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-2 sm:p-2.5 border border-[#e2e8f0] dark:border-[#334155] shadow-xs transition-colors">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setViewMode('standard')}
            style={viewMode === 'standard' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'standard'
                ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-md'
                : 'bg-[#f8fafc] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] hover:bg-[#ecfdf5] dark:hover:bg-[#334155]'
            }`}
          >
            <Search
              width={16}
              height={16}
              fill="none"
              stroke={viewMode === 'standard' ? '#ffffff' : '#16a34a'}
              className="w-4 h-4 shrink-0"
            />
            <span>Sözlük Arama</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('directory')}
            style={viewMode === 'directory' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'directory'
                ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-md'
                : 'bg-[#f8fafc] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] hover:bg-[#ecfdf5] dark:hover:bg-[#334155]'
            }`}
          >
            <BookA
              width={16}
              height={16}
              fill="none"
              stroke={viewMode === 'directory' ? '#ffffff' : '#16a34a'}
              className="w-4 h-4 shrink-0"
            />
            <span>A-Z Dizin (Fihrist)</span>
          </button>
        </div>
      </div>

      {viewMode === 'directory' ? (
        /* A-Z Directory / Glossary Mode */
        <div className="space-y-6">
          {/* Directory Filter Box: Part of Speech + Alphabet Selector */}
          <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-4 transition-colors">
            {/* Top filter bar: Part of Speech buttons ("Tümü", "Fiil", "İsim", "Sıfat", "Zarf"), with "Fiil" selected by DEFAULT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-1.5">
                  <Filter width={16} height={16} fill="none" stroke="#16a34a" className="w-4 h-4 shrink-0" />
                  <span>Sözcük Türü (Fihrist)</span>
                </h3>
                <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-0.5">
                  Fihristte listelemek istediğiniz sözcük türünü seçin
                </p>
              </div>

              {/* Part of Speech buttons: Tümü, Fiil (Default), İsim, Sıfat, Zarf */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'verb', label: 'Fiil' },
                  { id: 'noun', label: 'İsim' },
                  { id: 'adjective', label: 'Sıfat' },
                  { id: 'adverb', label: 'Zarf' },
                ].map((p) => {
                  const isActive = directoryPos === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDirectoryPos(p.id as PosFilter)}
                      style={isActive ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                      className={`px-3.5 py-2 rounded-xl text-xs tracking-tight transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] font-bold shadow-md'
                          : 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] font-medium'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-header / Alphabet Selector: Clean wrap-around grid of uppercase letters A to Z */}
            <div className="pt-3 border-t border-[#f1f5f9] dark:border-[#334155]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-[#475569] dark:text-[#94a3b8]">
                  Harf Seçin (A - Z):
                </span>
                <span className="text-xs font-mono text-[#16a34a] dark:text-[#34d399] font-bold">
                  Seçili Harf: &quot;{selectedLetter}&quot;
                </span>
              </div>

              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1.5">
                {ALPHABET.map((char) => {
                  const isSelected = selectedLetter === char;
                  const count = letterCounts[char] || 0;
                  const hasWords = count > 0;

                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => {
                        setSelectedLetter(char);
                        setExpandedDirCardId(null);
                      }}
                      style={isSelected ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                      className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] font-bold shadow-md z-10'
                          : hasWords
                          ? 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f8fafc] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] hover:text-[#16a34a] font-semibold'
                          : 'bg-[#f8fafc] dark:bg-[#0f172a] text-[#94a3b8] dark:text-[#475569] hover:bg-[#f1f5f9] font-normal'
                      }`}
                      title={`${char} harfi`}
                    >
                      <span className="text-xs sm:text-sm leading-none font-bold">{char}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Directory Word Entries Header */}
          <div className="flex items-center justify-between px-2 text-xs text-[#475569] dark:text-[#94a3b8]">
            <div>
              <span className="font-bold text-[#0f172a] dark:text-[#f8fafc] text-sm sm:text-base">
                &quot;{selectedLetter}&quot; Harfi Fihristi
              </span>
              <span className="ml-2 font-medium">
                ({directoryPos === 'all' ? 'Tüm Türler' : getPosTurkishLabel(directoryPos)})
              </span>
            </div>
          </div>

          {/* Directory Word List or Empty State */}
          {directoryWords.length === 0 ? (
            <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-8 sm:p-12 text-center border border-[#e2e8f0] dark:border-[#334155] transition-colors">
              <BookOpen width={48} height={48} fill="none" stroke="#94a3b8" className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f8fafc]">
                Bu harf ile başlayan kelime bulunamadı.
              </h3>
              <p className="text-sm text-[#475569] dark:text-[#94a3b8] mt-1 max-w-sm mx-auto">
                &quot;{selectedLetter}&quot; harfi ile başlayan {directoryPos === 'all' ? '' : getPosTurkishLabel(directoryPos).toLowerCase() + ' '}kelime mevcut veri setinde yer almıyor. Başka bir harf veya &quot;Tümü&quot; türünü deneyebilirsiniz.
              </p>
              {directoryPos !== 'all' && (
                <button
                  type="button"
                  onClick={() => setDirectoryPos('all')}
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  className="legacy-btn-green mt-4 px-4 py-2 bg-[#16a34a] text-[#ffffff] rounded-xl text-xs font-semibold hover:bg-[#15803d] transition-colors cursor-pointer"
                >
                  Tüm Türleri Göster
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {directoryWords.map((item) => {
                const isExpanded = expandedDirCardId === item.id;
                const isSpeakingWord = speakingId === `dir-word-${item.id}`;
                const isSpeakingEx = speakingId === `dir-ex-${item.id}`;
                const hasCollocations = Boolean(
                  Array.isArray(item.collocations) &&
                  item.collocations.length > 0 &&
                  item.collocations.some((c) => typeof c === 'string' && c.trim().length > 0)
                );
                const hasTip = Boolean(
                  item.academicNote &&
                  item.academicNote.trim().length > 0 &&
                  !item.isGeneralDict
                );

                return (
                  <article
                    key={item.id}
                    className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 border border-[#e2e8f0] dark:border-[#334155] hover:border-[#10b981] dark:hover:border-[#34d399] shadow-xs hover:shadow-md transition-all"
                  >
                    {/* Header Row: Word, Audio, Phonetic, Badges, Status & Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                            {item.word}
                          </h4>

                          {/* ENGLISH Word Audio Speaker */}
                          <button
                            type="button"
                            onClick={() => handleSpeakEnglish(item.word, `dir-word-${item.id}`)}
                            className={`p-1.5 rounded-xl text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] transition-colors ${
                              isSpeakingWord ? 'text-[#4f46e5] bg-[#eef2ff] dark:bg-[#1e1b4b] animate-pulse' : ''
                            }`}
                            title="İngilizce kelime telaffuzunu dinle"
                            aria-label={`İngilizce telaffuz: ${item.word}`}
                          >
                            <Volume2
                              width={20}
                              height={20}
                              fill="none"
                              stroke={isSpeakingWord ? '#4f46e5' : '#64748b'}
                              className="w-5 h-5"
                            />
                          </button>
                        </div>

                        {/* Badges & Status */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg tracking-wide ${getCefrBadgeClass(
                              item.cefrLevel
                            )}`}
                          >
                            {item.cefrLevel}
                          </span>

                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-lg ${getPosBadgeClass(
                              item.partOfSpeech
                            )}`}
                          >
                            {getPosTurkishLabel(item.partOfSpeech)}
                          </span>

                          {onUpdateStatus && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateStatus(
                                  item.id,
                                  item.status === 'ogrenildi' ? 'calisiliyor' : 'ogrenildi'
                                )
                              }
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                                item.status === 'ogrenildi'
                                  ? 'bg-[#ecfdf5] dark:bg-[#022c22] text-[#15803d] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]'
                                  : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e]'
                              }`}
                              title="Durumu değiştir"
                            >
                              {item.status === 'ogrenildi' ? (
                                <>
                                  <CheckCircle2 width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
                                  <span>Öğrenildi</span>
                                </>
                              ) : (
                                <>
                                  <Clock width={14} height={14} fill="none" stroke="#d97706" className="w-3.5 h-3.5" />
                                  <span>Çalışılıyor</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Verb Forms (V1 / V2 / V3) or Regular Verb Badge */}
                        <VerbConjugationBadge
                          word={item.word}
                          type={item.type}
                          partOfSpeech={item.partOfSpeech}
                        />
                      </div>

                      {/* Heart Favorite Icon */}
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-transform active:scale-125 cursor-pointer"
                        title={item.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine ekle'}
                        aria-label={item.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine ekle'}
                      >
                        <Heart
                          width={20}
                          height={20}
                          fill={item.isFavorite ? '#f43f5e' : 'none'}
                          stroke={item.isFavorite ? '#f43f5e' : '#94a3b8'}
                          className="w-5 h-5 transition-colors"
                        />
                      </button>
                    </div>

                    {/* Turkish Meaning - Tap to Expand */}
                    <div
                      onClick={() => setExpandedDirCardId(isExpanded ? null : item.id)}
                      className="mt-3.5 pt-3 border-t border-[#f1f5f9] dark:border-[#334155] cursor-pointer flex items-center justify-between gap-2 hover:opacity-90"
                    >
                      <p className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-[#f8fafc]">
                        {item.trMeaning}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#475569] hover:text-[#16a34a] dark:text-[#94a3b8] dark:hover:text-[#34d399] flex items-center gap-1 shrink-0"
                      >
                        <span>{isExpanded ? 'Gizle' : 'Detaylar'}</span>
                        {isExpanded ? (
                          <ChevronUp width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
                        ) : (
                          <ChevronDown width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <div className="mt-3.5 pt-3 border-t border-dashed border-[#e2e8f0] dark:border-[#334155] space-y-3 animate-in fade-in duration-150">
                        {/* Example sentence with English Audio */}
                        <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl p-4 border border-[#e2e8f0] dark:border-[#334155] space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc] leading-relaxed">
                              &quot;{item.enExample}&quot;
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSpeakEnglish(item.enExample, `dir-ex-${item.id}`)}
                              className={`p-1.5 shrink-0 rounded-xl text-[#475569] hover:text-[#16a34a] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors ${
                                isSpeakingEx ? 'text-[#16a34a] animate-pulse' : ''
                              }`}
                              title="İngilizce örnek cümleyi dinle"
                            >
                              <Volume2
                                width={16}
                                height={16}
                                fill="none"
                                stroke={isSpeakingEx ? '#16a34a' : '#64748b'}
                                className="w-4 h-4"
                              />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic">
                            &quot;{item.trExample}&quot;
                          </p>
                        </div>

                        {/* Exam Tip */}
                        {hasTip && (
                          <div className="flex items-start gap-2.5 text-xs bg-[#fffbeb] dark:bg-[#451a03] p-3.5 rounded-2xl border border-[#fde68a] dark:border-[#92400e] text-[#451a03] dark:text-[#fef3c7]">
                            <Sparkles width={16} height={16} fill="none" stroke="#d97706" className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block mb-0.5 text-[#451a03] dark:text-[#fde68a]">
                                Hazırlık Sınavı İpucu:
                              </strong>
                              <span className="leading-relaxed">{item.academicNote}</span>
                            </div>
                          </div>
                        )}

                        {/* Collocations */}
                        {hasCollocations && item.collocations && (
                          <div className="text-xs">
                            <span className="font-bold text-[#0f172a] dark:text-[#f8fafc] block mb-1.5">
                              Sık Kullanılan Birlikte Kullanımlar (Collocations):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.collocations.filter(Boolean).map((col, idx) => (
                                <span
                                  key={idx}
                                  className="bg-[#ffffff] dark:bg-[#0f172a] px-2.5 py-1 rounded-xl border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] font-mono text-[11px]"
                                >
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {onPracticeWord && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onPracticeWord(item)}
                              className="text-xs font-bold text-[#4f46e5] dark:text-[#818cf8] hover:underline flex items-center gap-1.5"
                            >
                              <Mic width={14} height={14} fill="none" stroke="#4f46e5" className="w-3.5 h-3.5" />
                              <span>Telaffuz Testi Yap</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Standard Search & List View */
        <>
          {/* Search & Filter Header Box */}
          <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm transition-colors space-y-4">
        {/* Instant Search Bar with Prominent Emerald Focus Styling & Autocomplete Suggestions */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplicitSearch();
          }}
          className="relative w-full"
        >
          <div className="relative flex items-center w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#16a34a]">
              <Search width={20} height={20} fill="none" stroke="#16a34a" className="w-5 h-5" />
            </div>
            <input
              ref={inputRef}
              type="text"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
                ensureGeneralDictionaryLoaded();
              }}
              onFocus={() => {
                setIsInputFocused(true);
                setShowSuggestions(true);
                ensureGeneralDictionaryLoaded();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Kelime veya anlam ara (İngilizce / Türkçe)..."
              className={`preplingo-search-input w-full pl-11 py-3.5 rounded-2xl text-sm sm:text-base font-medium ${
                searchQuery ? 'pr-20' : 'pr-12'
              }`}
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                  setOnlineResults([]);
                  setOnlineErrorReason(null);
                  inputRef.current?.focus();
                }}
                className="absolute right-12 w-8 h-8 rounded-full flex items-center justify-center text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition-colors cursor-pointer"
                aria-label="Aramayı temizle"
                title="Temizle"
              >
                <X width={16} height={16} fill="none" stroke="#64748b" className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExplicitSearch()}
              aria-label="Ara"
              title="Ara"
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="legacy-btn-green absolute right-2 flex items-center justify-center w-9 h-9 rounded-full bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-[#ffffff] shadow-sm transition cursor-pointer"
            >
              <ArrowRight
                width={18}
                height={18}
                fill="none"
                stroke="#ffffff"
                className="w-[18px] h-[18px]"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Autocomplete Suggestions Floating Dropdown */}
          {showSuggestions && isInputFocused && suggestions.length > 0 && searchQuery.trim().length >= 1 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#ffffff] dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e2e8f0] dark:border-[#334155] overflow-hidden divide-y divide-[#f1f5f9] dark:divide-[#334155] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="px-3.5 py-1.5 bg-[#f8fafc] dark:bg-[#0f172a] flex items-center justify-between text-[11px] text-[#475569] dark:text-[#94a3b8] font-medium">
                <span>Önerilen Kelimeler</span>
                <span className="text-[10px] hidden sm:inline text-[#64748b] dark:text-[#94a3b8] font-mono">
                  Seçmek için dokunun
                </span>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-[#f1f5f9] dark:divide-[#334155]">
                {suggestions.map((item, index) => {
                  const isSelected = activeSuggestionIndex === index;
                  return (
                    <li
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#ecfdf5] dark:bg-[#064e3b] text-[#065f46] dark:text-[#a7f3d0]'
                          : 'hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] text-sm sm:text-base">
                          {item.word}
                        </span>
                        <span className="text-xs font-mono text-[#475569] dark:text-[#94a3b8] shrink-0">
                          ({getPosAbbr(item.partOfSpeech)})
                        </span>
                        <span className="text-[#cbd5e1] dark:text-[#475569]">·</span>
                        <span className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] truncate">
                          {item.trMeaning}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isGeneralDict ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f0f9ff] dark:bg-[#082f49] text-[#0369a1] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985]">
                            Genel Sözlük
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${getCefrBadgeClass(
                              item.cefrLevel
                            )}`}
                          >
                            {item.cefrLevel}
                          </span>
                        )}
                        <ArrowUpRight width={14} height={14} fill="none" stroke="#94a3b8" className="w-3.5 h-3.5" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </form>

        {/* Immediate Feedback Card right below the Search Bar when exact word match is missing (>= 2 chars) */}
        {!hasExactLocalMatch && onlineResults.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="pt-1">
            {!isOnline ||
            (typeof navigator !== 'undefined' && navigator.onLine === false) ||
            onlineErrorReason === 'offline' ||
            onlineErrorReason === 'network_error' ? (
              <div className="rounded-2xl p-4 sm:p-5 bg-[#fffbeb] dark:bg-[#451a03] border border-[#fde68a] dark:border-[#92400e] flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left animate-in fade-in duration-150">
                <div className="w-10 h-10 rounded-full bg-[#fef3c7] dark:bg-[#78350f] flex items-center justify-center shrink-0">
                  <WifiOff width={20} height={20} fill="none" stroke="#d97706" className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-[#0f172a] dark:text-[#ffffff] leading-relaxed">
                    &lsquo;{searchQuery.trim()}&rsquo; yerel veritabanında bulunamadı. Çevrimiçi sözlükte aramak için internet bağlantınızı açın.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setOnlineResults([]);
                    setOnlineErrorReason(null);
                  }}
                  className="px-3.5 py-2 bg-[#ffffff] dark:bg-[#1e293b] border border-[#fde68a] dark:border-[#92400e] text-[#334155] dark:text-[#e2e8f0] rounded-xl text-xs font-semibold hover:bg-[#fef3c7] dark:hover:bg-[#334155] transition-colors shrink-0 cursor-pointer"
                >
                  Temizle
                </button>
              </div>
            ) : isOnlineLoading || !isGeneralDictLoaded || onlineErrorReason === null ? (
              <div className="rounded-2xl p-4 sm:p-5 bg-[#eef2ff] dark:bg-[#1e1b4b] border border-[#c7d2fe] dark:border-[#3730a3] flex items-center gap-3 animate-in fade-in duration-150">
                <Loader2 width={20} height={20} fill="none" stroke="#4f46e5" className="w-5 h-5 animate-spin shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-[#0f172a] dark:text-[#ffffff]">
                    Çevrimiçi sözlükte aranıyor...
                  </p>
                  <p className="text-xs text-[#475569] dark:text-[#cbd5e1]">
                    &lsquo;{searchQuery.trim()}&rsquo; için anlam, telaffuz ve tanım getiriliyor.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 sm:p-5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <BookOpen width={20} height={20} fill="none" stroke="#64748b" className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                    Bu kelime sözlüklerde bulunamadı.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCefrFilter('Tümü');
                    setPosFilter('all');
                    setStatusFilter('all');
                  }}
                  style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                  className="legacy-btn-green px-3.5 py-2 bg-[#16a34a] text-[#ffffff] rounded-xl text-xs font-semibold hover:bg-[#15803d] transition-colors shrink-0 cursor-pointer"
                >
                  Aramayı Temizle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter Controls Row: CEFR Level & Part of Speech */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* CEFR Level Segmented Control Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f1f5f9] dark:bg-[#0f172a] rounded-2xl w-full sm:w-auto">
            {(['Tümü', 'A1-A2', 'B1-B2'] as CefrFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCefrFilter(tab)}
                style={cefrFilter === tab ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  cefrFilter === tab
                    ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-sm'
                    : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f8fafc] font-medium'
                }`}
              >
                {tab === 'Tümü' ? 'Tüm Seviyeler' : tab}
              </button>
            ))}
          </div>

          {/* Part of Speech Filter - HIGH CONTRAST ACTIVE STATE */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-[#475569] dark:text-[#94a3b8] font-bold shrink-0 mr-1 text-[11px] flex items-center gap-1">
              <Filter width={12} height={12} fill="none" stroke="#16a34a" className="w-3 h-3" />
              <span>Tür:</span>
            </span>
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'noun', label: 'İsim' },
              { id: 'verb', label: 'Fiil' },
              { id: 'adjective', label: 'Sıfat' },
              { id: 'adverb', label: 'Zarf' },
            ].map((p) => {
              const isActive = posFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPosFilter(p.id as PosFilter)}
                  style={isActive ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
                  className={`px-3 py-1.5 rounded-xl text-xs tracking-tight transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] font-bold shadow-md'
                      : 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] font-medium'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filters: All, Öğrenildi, Çalışılıyor */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9] dark:border-[#334155]">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#475569] dark:text-[#94a3b8] font-semibold mr-1 text-[11px]">Durum:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={statusFilter === 'all' ? { backgroundColor: '#0f172a', color: '#ffffff' } : undefined}
              className={`px-3 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'legacy-btn-dark bg-[#0f172a] text-[#ffffff] border border-[#334155] shadow-xs'
                  : 'bg-[#f1f5f9] dark:bg-[#0f172a] text-[#475569] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155]'
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ogrenildi')}
              style={statusFilter === 'ogrenildi' ? { backgroundColor: '#16a34a', color: '#ffffff' } : undefined}
              className={`px-3 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'ogrenildi'
                  ? 'legacy-btn-green bg-[#16a34a] text-[#ffffff] shadow-xs'
                  : 'bg-[#ecfdf5] dark:bg-[#022c22] text-[#15803d] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#065f46] hover:bg-[#d1fae5]'
              }`}
            >
              <CheckCircle2
                width={14}
                height={14}
                fill="none"
                stroke={statusFilter === 'ogrenildi' ? '#ffffff' : '#16a34a'}
                className="w-3.5 h-3.5"
              />
              <span>Öğrenildi</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('calisiliyor')}
              style={statusFilter === 'calisiliyor' ? { backgroundColor: '#d97706', color: '#ffffff' } : undefined}
              className={`px-3 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                statusFilter === 'calisiliyor'
                  ? 'bg-[#d97706] text-[#ffffff] shadow-xs'
                  : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border border-[#fde68a] dark:border-[#92400e] hover:bg-[#fef3c7]'
              }`}
            >
              <Clock
                width={14}
                height={14}
                fill="none"
                stroke={statusFilter === 'calisiliyor' ? '#ffffff' : '#d97706'}
                className="w-3.5 h-3.5"
              />
              <span>Çalışılıyor</span>
            </button>
          </div>

          {/* Source / Loading Status Line (only shown for online or general fallback searches, no word counter) */}
          {(isOnlineLoading || isFromOnlineDict || isFromGeneralDict) && (
            <div className="text-xs text-[#475569] dark:text-[#94a3b8]">
              {isOnlineLoading ? (
                <span className="flex items-center gap-1.5 font-medium text-[#16a34a] dark:text-[#34d399]">
                  <Loader2 width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Çevrimiçi sözlükte aranıyor...</span>
                </span>
              ) : isFromOnlineDict ? (
                <span className="flex items-center gap-1.5 font-medium text-[#0f766e] dark:text-[#5eead4]">
                  <Globe width={14} height={14} fill="none" stroke="#14b8a6" className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Yerel listede bulunamadı, <strong className="font-bold">Çevrimiçi Sözlük 🌐</strong> üzerinden sonuç gösteriliyor
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-[#0369a1] dark:text-[#7dd3fc]">
                  <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse" />
                  <span>
                    Hazırlık listesinde bulunamadı, <strong className="font-bold underline">Genel Sözlük</strong> üzerinden sonuç gösteriliyor
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Word Entries List */}
      {filteredWords.length === 0 ? (
        searchQuery.trim().length >= 2 ? null : (
          <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-8 text-center border border-[#e2e8f0] dark:border-[#334155] transition-colors">
            <BookOpen width={48} height={48} fill="none" stroke="#94a3b8" className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0f172a] dark:text-[#f8fafc]">
              Kelime bulunamadı
            </h3>
            <p className="text-sm text-[#475569] dark:text-[#94a3b8] mt-1 max-w-sm mx-auto">
              Farklı harflerle aramayı deneyebilir veya filtreyi &quot;Tümü&quot; olarak sıfırlayabilirsiniz.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCefrFilter('Tümü');
                setPosFilter('all');
                setStatusFilter('all');
              }}
              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
              className="legacy-btn-green mt-4 px-4 py-2 bg-[#16a34a] text-[#ffffff] rounded-xl text-xs font-semibold hover:bg-[#15803d] transition-colors cursor-pointer"
            >
              Tüm Filtreleri Temizle
            </button>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredWords.slice(0, visibleBatchCount).map((item) => {
            const isExpanded = expandedCardId === item.id;
            const isSpeakingWord = speakingId === `word-${item.id}`;
            const isSpeakingEx = speakingId === `ex-${item.id}`;
            const isHighlighted = highlightedWordId === item.id;
            const hasCollocations = Boolean(
              Array.isArray(item.collocations) &&
              item.collocations.length > 0 &&
              item.collocations.some((c) => typeof c === 'string' && c.trim().length > 0)
            );
            const hasTip = Boolean(
              item.academicNote &&
              item.academicNote.trim().length > 0 &&
              !item.isGeneralDict
            );

            return (
              <article
                key={item.id}
                id={`word-card-${item.id}`}
                className={`group bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-6 border transition-all duration-300 ${
                  isHighlighted
                    ? 'ring-4 ring-[#10b981] shadow-2xl border-[#10b981] dark:border-[#34d399] scale-[1.015]'
                    : 'border-[#e2e8f0] dark:border-[#334155] hover:border-[#10b981] dark:hover:border-[#34d399] shadow-xs hover:shadow-md'
                }`}
              >
                {/* Header Row: English Word + Phonetic + Vibrant Badges + Audio (ONLY English) + Status Indicator + Bookmark */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc] tracking-tight">
                        {item.word}
                      </h2>

                      {/* ENGLISH Word Audio Speaker Button */}
                      <button
                        type="button"
                        onClick={() => handleSpeakEnglish(item.word, `word-${item.id}`)}
                        className={`p-1.5 rounded-xl text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] transition-colors ${
                          isSpeakingWord ? 'text-[#4f46e5] bg-[#eef2ff] dark:bg-[#1e1b4b] animate-pulse' : ''
                        }`}
                        title="İngilizce kelime telaffuzunu dinle"
                        aria-label={`İngilizce telaffuz: ${item.word}`}
                      >
                        <Volume2
                          width={20}
                          height={20}
                          fill="none"
                          stroke={isSpeakingWord ? '#4f46e5' : '#64748b'}
                          className="w-5 h-5"
                        />
                      </button>

                      {item.isOnlineDict && item.phonetic && (
                        <span className="text-xs sm:text-sm font-mono text-[#64748b] dark:text-[#94a3b8]">
                          {item.phonetic}
                        </span>
                      )}
                    </div>

                    {/* Part of Speech & CEFR Level Badges & Status */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* CEFR Badge or Online/Genel Sözlük Badge */}
                      {item.isOnlineDict ? (
                        <>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#f0fdfa] dark:bg-[#042f2e] text-[#0f766e] dark:text-[#5eead4] border border-[#5eead4] dark:border-[#115e59] flex items-center gap-1 shadow-2xs">
                            <Globe width={14} height={14} fill="none" stroke="#0d9488" className="w-3.5 h-3.5" />
                            <span>Çevrimiçi Sözlük 🌐</span>
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-lg ${getPosBadgeClass(
                              item.partOfSpeech
                            )}`}
                          >
                            {getPosTurkishLabel(item.partOfSpeech)}
                          </span>
                        </>
                      ) : item.isGeneralDict ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#f0f9ff] dark:bg-[#082f49] text-[#0369a1] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985] flex items-center gap-1 shadow-2xs">
                          <BookOpen width={14} height={14} fill="none" stroke="#0284c7" className="w-3.5 h-3.5" />
                          <span>Genel Sözlük</span>
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-[11px] uppercase px-2.5 py-0.5 rounded-lg tracking-wide ${getCefrBadgeClass(
                              item.cefrLevel
                            )}`}
                          >
                            {item.cefrLevel}
                          </span>

                          {/* Part of Speech Badge - Vibrant Domain Colors */}
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-lg ${getPosBadgeClass(
                              item.partOfSpeech
                            )}`}
                          >
                            {getPosTurkishLabel(item.partOfSpeech)}
                          </span>

                          {/* Word Status Indicator: Öğrenildi or Çalışılıyor */}
                          {onUpdateStatus && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateStatus(
                                    item.id,
                                    item.status === 'ogrenildi' ? 'calisiliyor' : 'ogrenildi'
                                  )
                                }
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                                  item.status === 'ogrenildi'
                                    ? 'bg-[#ecfdf5] dark:bg-[#022c22] text-[#15803d] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46] hover:bg-[#d1fae5]'
                                    : 'bg-[#fffbeb] dark:bg-[#451a03] text-[#b45309] dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e] hover:bg-[#fef3c7]'
                                }`}
                                title="Durumu değiştir"
                              >
                                {item.status === 'ogrenildi' ? (
                                  <>
                                    <CheckCircle2 width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
                                    <span>Öğrenildi</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock width={14} height={14} fill="none" stroke="#d97706" className="w-3.5 h-3.5" />
                                    <span>Çalışılıyor</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {item.isCustom && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f1f5f9] dark:bg-[#1e293b] text-[#475569] dark:text-[#cbd5e1]">
                              Özel
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Verb Forms (V1 / V2 / V3) or Regular Verb Badge */}
                    <VerbConjugationBadge
                      word={item.word}
                      type={item.type}
                      partOfSpeech={item.partOfSpeech}
                    />
                  </div>

                  {/* Heart Favorite Button */}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-transform active:scale-125 cursor-pointer"
                    title={item.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine ekle'}
                    aria-label={item.isFavorite ? 'Kelime defterinden çıkar' : 'Kelime defterine ekle'}
                  >
                    <Heart
                      width={20}
                      height={20}
                      fill={item.isFavorite ? '#f43f5e' : 'none'}
                      stroke={item.isFavorite ? '#f43f5e' : '#94a3b8'}
                      className="w-5 h-5 transition-colors"
                    />
                  </button>
                </div>

                {/* Primary Turkish Meaning */}
                <div className="mt-4 pt-3.5 border-t border-[#f1f5f9] dark:border-[#334155] space-y-1.5">
                  <p className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-[#f8fafc]">
                    {item.trMeaning}
                  </p>
                  {item.isOnlineDict && item.enDefinition && item.enDefinition !== item.trMeaning && (
                    <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] leading-relaxed">
                      <span className="font-semibold text-[#0f766e] dark:text-[#2dd4bf] mr-1.5">
                        Akademik Tanım (EN):
                      </span>
                      {item.enDefinition}
                    </p>
                  )}
                </div>

                {/* General Dictionary Fallback vs Rich/Online Card Content */}
                {item.isGeneralDict ? (
                  <div className="mt-3.5 py-2.5 px-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] text-xs text-[#475569] dark:text-[#94a3b8] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] shrink-0" />
                    <span>Temel sözlük kaydı (Hazırlık kartı bulunmamaktadır).</span>
                  </div>
                ) : (
                  <>
                    {/* English Example Sentence (WITH ENGLISH AUDIO) & Turkish Translation (WITHOUT AUDIO) */}
                    <div className="mt-3.5 bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] dark:border-[#334155] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm sm:text-base font-semibold text-[#0f172a] dark:text-[#f8fafc] leading-relaxed">
                          &quot;{item.enExample}&quot;
                        </p>
                        {/* ENGLISH Example Sentence Audio Speaker Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeakEnglish(item.enExample, `ex-${item.id}`)}
                          className={`p-1.5 shrink-0 rounded-xl text-[#475569] hover:text-[#16a34a] hover:bg-[#ecfdf5] dark:hover:bg-[#334155] transition-colors ${
                            isSpeakingEx ? 'text-[#16a34a] animate-pulse' : ''
                          }`}
                          title="İngilizce örnek cümleyi dinle"
                        >
                          <Volume2
                            width={16}
                            height={16}
                            fill="none"
                            stroke={isSpeakingEx ? '#16a34a' : '#64748b'}
                            className="w-4 h-4"
                          />
                        </button>
                      </div>
                      {/* Turkish translation of example sentence (NO AUDIO BUTTON) */}
                      <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic">
                        &quot;{item.trExample}&quot;
                      </p>
                    </div>

                    {/* Academic Prep Notes & Collocations Expandable Drawer */}
                    {(hasTip || hasCollocations) && (
                      <div className="mt-3.5 pt-2">
                        {isExpanded ? (
                          <div className="space-y-3 pt-2.5 border-t border-dashed border-[#e2e8f0] dark:border-[#334155] animate-in fade-in duration-150">
                            {hasTip && (
                              <div className="flex items-start gap-2.5 text-xs bg-[#fffbeb] dark:bg-[#451a03] p-3.5 rounded-2xl border border-[#fde68a] dark:border-[#92400e] text-[#451a03] dark:text-[#fef3c7]">
                                <Sparkles width={16} height={16} fill="none" stroke="#d97706" className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-bold block mb-0.5 text-[#451a03] dark:text-[#fde68a]">Hazırlık Sınavı İpucu:</strong>
                                  <span className="leading-relaxed text-[#78350f] dark:text-[#fef3c7]">{item.academicNote}</span>
                                </div>
                              </div>
                            )}

                            {hasCollocations && item.collocations && (
                              <div className="text-xs text-[#475569] dark:text-[#94a3b8]">
                                <span className="font-bold text-[#0f172a] dark:text-[#f8fafc] block mb-1.5">
                                  Sık Kullanılan Birlikte Kullanımlar (Collocations):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.collocations.filter(Boolean).map((col, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-[#ffffff] dark:bg-[#0f172a] px-2.5 py-1 rounded-xl border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] font-mono text-[11px] shadow-2xs"
                                    >
                                      {col}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Toggle Details Button & Quick Practice CTA */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedCardId(isExpanded ? null : item.id)}
                            className="text-xs font-semibold text-[#475569] hover:text-[#4f46e5] dark:text-[#94a3b8] dark:hover:text-[#818cf8] flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Gizle</span>
                                <ChevronUp width={14} height={14} fill="none" stroke="#64748b" className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>
                                  {hasTip && hasCollocations
                                    ? 'Akademik İpuçları ve Birlikte Kullanımlar'
                                    : hasCollocations
                                    ? 'Birlikte Kullanımlar (Collocations)'
                                    : 'Hazırlık Sınavı İpucu'}
                                </span>
                                <ChevronDown width={14} height={14} fill="none" stroke="#64748b" className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          {onPracticeWord && (
                            <button
                              type="button"
                              onClick={() => onPracticeWord(item)}
                              className="text-xs font-bold text-[#4f46e5] dark:text-[#818cf8] hover:underline flex items-center gap-1.5"
                            >
                              <Mic width={14} height={14} fill="none" stroke="#4f46e5" className="w-3.5 h-3.5" />
                              <span>Telaffuz Testi Yap</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sleek footer for cards without tips or collocations */}
                    {!hasTip && !hasCollocations && onPracticeWord && (
                      <div className="mt-3 pt-2 border-t border-[#f1f5f9] dark:border-[#334155] flex justify-end">
                        <button
                          type="button"
                          onClick={() => onPracticeWord(item)}
                          className="text-xs font-bold text-[#16a34a] dark:text-[#34d399] hover:underline flex items-center gap-1.5"
                        >
                          <Mic width={14} height={14} fill="none" stroke="#16a34a" className="w-3.5 h-3.5" />
                          <span>Telaffuz Testi Yap</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>

          {filteredWords.length > visibleBatchCount && (
            <div className="pt-2 pb-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleBatchCount((prev) => prev + 30)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-sm font-bold text-[#16a34a] dark:text-[#34d399] hover:bg-[#f8fafc] dark:hover:bg-[#334155] shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Daha Fazla Kelime Göster</span>
              </button>
            </div>
          )}
        </>
      )}
        </>
      )}
    </div>
  );
};
