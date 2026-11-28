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
  offlineDictionary,
  searchOfflineDictionary,
  ensureOfflineDictionaryLoaded,
  PREP_CARD_WORD_SET,
} from '../data/offlineDictionaryLoader';
import { lookupOnlineDictionary, getCachedOnlineWord } from '../utils/onlineDictionary';
import { compareWordsAlphabetically } from '../data/initialWords';
import { findDidYouMeanSuggestions } from '../utils/didYouMean';

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
  const queryTrLower = queryLower.toLocaleLowerCase('tr-TR');

  // 1. Exact English word match
  if (index.wordLower === queryLower) return 100;
  if (normQuery && index.wordNorm === normQuery) return 95;

  // 2. English word prefix (startsWith) match
  if (index.wordLower.startsWith(queryLower)) return 85;
  if (normQuery && index.wordNorm.startsWith(normQuery)) return 80;

  // 3. Turkish meaning exact sense or word-start match
  if (
    index.meaningSensesLower.some((s) => s === queryTrLower) ||
    (normQuery && index.meaningSensesNorm.some((s) => s === normQuery))
  ) {
    return 70;
  }
  if (
    index.meaningSensesLower.some((s) => s.startsWith(queryTrLower)) ||
    (normQuery && index.meaningSensesNorm.some((s) => s.startsWith(normQuery)))
  ) {
    return 65;
  }
  if (
    index.meaningRawTokens.some((t) => t.startsWith(queryTrLower)) ||
    (normQuery && index.meaningNormTokens.some((t) => t.startsWith(normQuery)))
  ) {
    return 60;
  }

  return 0;
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

  // Track background async load state of external public/sozluk.json offline dictionary
  const [isOfflineDictLoaded, setIsOfflineDictLoaded] = useState(() =>
    offlineDictionary.getIsLoaded()
  );

  useEffect(() => {
    ensureOfflineDictionaryLoaded();
    return offlineDictionary.subscribe(() => {
      setIsOfflineDictLoaded(true);
    });
  }, []);

  // Live Prep Card words (excluding any bookmarked offline entries) & fast lowercase Set for ZERO collision
  const prepCardWords = useMemo(
    () => words.filter((w) => !w.isOfflineDict && !w.id.startsWith('offline_')),
    [words]
  );

  const prepCardWordSet = useMemo(() => {
    const set = new Set<string>(PREP_CARD_WORD_SET);
    for (const w of prepCardWords) {
      if (w.word) set.add(w.word.trim().toLowerCase());
    }
    return set;
  }, [prepCardWords]);

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
  const searchBoxContainerRef = useRef<HTMLDivElement>(null);

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

  // Generate TOP 8 live autocomplete suggestions (starting from 1st character):
  // Strict priority: (1) Exact match first (Prep Card exact -> Offline exact),
  //                  (2) 2,573 Prep Cards (English prefix before Turkish meaning, shorter words first),
  //                  (3) Cleaned offline dictionary matches (shorter words first).
  const suggestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    const query = trimmed.toLowerCase();
    if (!query) return [];

    const queryTrLower = trimmed.toLocaleLowerCase('tr-TR');
    const normQuery = normalizeForSearch(query);

    const exactPrep: WordEntry[] = [];
    const prepPrefixEn: WordEntry[] = [];
    const prepPrefixTr: WordEntry[] = [];

    for (let i = 0; i < prepCardWords.length; i++) {
      const word = prepCardWords[i];
      const index = getWordSearchIndex(word);

      if (index.wordLower === query || (normQuery && index.wordNorm === normQuery)) {
        exactPrep.push(word);
      } else if (index.wordLower.startsWith(query) || (normQuery && index.wordNorm.startsWith(normQuery))) {
        prepPrefixEn.push(word);
      } else if (
        index.meaningSensesLower.some((s) => s.startsWith(queryTrLower)) ||
        (normQuery && index.meaningSensesNorm.some((s) => s.startsWith(normQuery))) ||
        index.meaningRawTokens.some((t) => t.startsWith(queryTrLower)) ||
        (normQuery && index.meaningNormTokens.some((t) => t.startsWith(normQuery)))
      ) {
        prepPrefixTr.push(word);
      }
    }

    const sortShorterFirst = (a: WordEntry, b: WordEntry) =>
      a.word.length - b.word.length || compareWordsAlphabetically(a, b);

    exactPrep.sort(sortShorterFirst);
    prepPrefixEn.sort(sortShorterFirst);
    prepPrefixTr.sort(sortShorterFirst);

    const exactOffline: WordEntry[] = [];
    const offlineRest: WordEntry[] = [];

    // Fetch cleaned offline dictionary matches (already shortest-first)
    const offlineMatches = searchOfflineDictionary(trimmed, 16, prepCardWordSet);
    for (let i = 0; i < offlineMatches.length; i++) {
      const offWord = offlineMatches[i];
      const key = offWord.word.toLowerCase();
      if (prepCardWordSet.has(key)) continue;

      if (key === query || (normQuery && normalizeForSearch(key) === normQuery)) {
        exactOffline.push(offWord);
      } else {
        offlineRest.push(offWord);
      }
    }

    const combined: WordEntry[] = [];
    const seenWords = new Set<string>();
    const appendUnique = (list: WordEntry[]) => {
      for (let i = 0; i < list.length; i++) {
        if (combined.length >= 8) break;
        const item = list[i];
        const key = item.word.toLowerCase();
        if (!seenWords.has(key)) {
          seenWords.add(key);
          combined.push(item);
        }
      }
    };

    // 1) Exact match first (Prep Card exact, then Offline exact)
    appendUnique(exactPrep);
    appendUnique(exactOffline);
    // 2) Remaining Prep Card matches
    appendUnique(prepPrefixEn);
    appendUnique(prepPrefixTr);
    // 3) Remaining cleaned offline dictionary matches (shortest words first)
    appendUnique(offlineRest);

    return combined;
  }, [prepCardWords, prepCardWordSet, searchQuery, isOfflineDictLoaded]);

  // Click / touch outside listener to dismiss suggestions pop-up
  useEffect(() => {
    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, []);

  // Explicit Search Submit handler (Arrow button click or mobile/desktop Enter key)
  const handleExplicitSearch = () => {
    setShowSuggestions(false);
    setIsInputFocused(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.blur();
    ensureOfflineDictionaryLoaded();

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
    if (word.isOfflineDict || word.isGeneralDict || word.cefrLevel === 'Genel') {
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

    // Open detail card & highlight the selected card
    if (!word.isOfflineDict && !word.isGeneralDict) {
      setExpandedCardId(word.id);
    }
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

  // 3-Stage Search Priority Pipeline:
  // Stage 1: 2,575 Prep Cards (prepCardWords) — ALWAYS searched & shown first
  // Stage 2: External Offline General Dictionary (public/sozluk.json) — strictly deduplicated via prepCardWordSet
  // Stage 3: Online Dictionary API (only when NOT found in Stage 1 or Stage 2)
  const { localMatches, isFromOfflineDict } = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const trimmedLower = trimmedQuery.toLowerCase();

    // Stage 1: Prep Cards search (prefix/word-start matching on English word & Turkish meaning)
    const primaryMatches = prepCardWords.filter((item) => {
      if (cefrFilter !== 'Tümü') {
        if (cefrFilter === 'A1-A2') {
          if (item.cefrLevel !== 'A1' && item.cefrLevel !== 'A2') return false;
        } else if (cefrFilter === 'B1-B2') {
          if (item.cefrLevel !== 'B1' && item.cefrLevel !== 'B2') return false;
        } else if (item.cefrLevel !== cefrFilter) {
          return false;
        }
      }

      if (!matchesPartOfSpeechFilter(item, posFilter)) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }

      if (trimmedQuery) {
        return fastMatchWord(item, trimmedQuery);
      }

      return true;
    });

    if (!trimmedQuery) {
      return { localMatches: primaryMatches, isFromOfflineDict: false };
    }

    // If Stage 1 (Prep Cards) has an exact match, return ONLY Stage 1 immediately
    const primaryHasExact = primaryMatches.some(
      (w) => w.word.toLowerCase().trim() === trimmedLower
    );
    if (primaryHasExact) {
      return { localMatches: primaryMatches, isFromOfflineDict: false };
    }

    // Stage 2: External Offline General Dictionary (public/sozluk.json), strictly deduplicated against prepCardWordSet
    const offlineMatches = searchOfflineDictionary(trimmedQuery, 40, prepCardWordSet).filter(
      (item) => matchesPartOfSpeechFilter(item, posFilter)
    );

    // Hydrate favorite state if the user bookmarked an offline entry
    const favoriteIdMap = new Map<string, boolean>();
    for (const w of words) {
      if (w.isFavorite) favoriteIdMap.set(w.id, true);
    }
    const hydratedOfflineMatches = offlineMatches.map((entry) =>
      favoriteIdMap.has(entry.id) ? { ...entry, isFavorite: true } : entry
    );

    // If Stage 1 has matches: keep Stage 1 first; only append an exact match from Stage 2 if present
    if (primaryMatches.length > 0) {
      const exactOffline = hydratedOfflineMatches.filter(
        (w) => w.word.toLowerCase().trim() === trimmedLower
      );
      if (exactOffline.length > 0) {
        return {
          localMatches: [...primaryMatches, ...exactOffline],
          isFromOfflineDict: false,
        };
      }
      return { localMatches: primaryMatches, isFromOfflineDict: false };
    }

    // Stage 1 had 0 matches -> show Stage 2 (public/sozluk.json) results cleanly
    if (hydratedOfflineMatches.length > 0) {
      return {
        localMatches: hydratedOfflineMatches,
        isFromOfflineDict: true,
      };
    }

    return {
      localMatches: [],
      isFromOfflineDict: false,
    };
  }, [
    words,
    prepCardWords,
    prepCardWordSet,
    cefrFilter,
    posFilter,
    statusFilter,
    searchQuery,
    isOfflineDictLoaded,
  ]);

  // Exact local word match check across Stage 1 (Prep Cards) and Stage 2 (Offline Dictionary)
  const hasExactLocalMatch = useMemo(() => {
    const trimmedLower = searchQuery.toLowerCase().trim();
    const trimmedTrLower = searchQuery.toLocaleLowerCase('tr-TR').trim();
    if (!trimmedLower) return false;
    return localMatches.some((w) => {
      if (w.word.toLowerCase().trim() === trimmedLower) return true;
      const tr = (w.trMeaning || w.meaning || '').toLocaleLowerCase('tr-TR').trim();
      if (!tr) return false;
      if (tr === trimmedTrLower) return true;
      return tr.split(/[,;/()]+/).some((part) => part.trim() === trimmedTrLower);
    });
  }, [localMatches, searchQuery]);

  // Offline Levenshtein "Bunu mu demek istediniz?" suggestions:
  // Performance guard: ONLY runs when local search returned 0 matches AND query has >= 3 chars.
  const didYouMeanSuggestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (localMatches.length > 0 || trimmed.length < 3) return [];
    return findDidYouMeanSuggestions(
      trimmed,
      prepCardWords,
      offlineDictionary.getEntriesForSuggestions(),
      4
    );
  }, [searchQuery, localMatches.length, prepCardWords, isOfflineDictLoaded]);

  const handleSelectDidYouMean = (suggestedWord: string) => {
    setSearchQuery(suggestedWord);
    setCefrFilter('Tümü');
    setPosFilter('all');
    setStatusFilter('all');
    setShowSuggestions(false);
    setIsInputFocused(false);
    setActiveSuggestionIndex(-1);
    setOnlineResults([]);
    setOnlineErrorReason(null);
    inputRef.current?.blur();
  };

  // Stage 3: Automatic Online Lookup (500ms debounced on typing, 0ms on Search Button / Enter)
  // Triggered ONLY when a searched word (min 2 chars) is NOT found in Stage 1 or Stage 2.
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (viewMode !== 'standard' || trimmedQuery.length < 2 || hasExactLocalMatch) {
      forceImmediateRef.current = false;
      setOnlineResults([]);
      setIsOnlineLoading(false);
      setOnlineErrorReason(null);
      return;
    }

    // Wait for Stage 2 public/sozluk.json to finish loading before querying Stage 3 online API
    if (!isOfflineDictLoaded) {
      ensureOfflineDictionaryLoaded();
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
  }, [searchQuery, hasExactLocalMatch, isOfflineDictLoaded, viewMode, isOnline, searchSubmitCount]);

  // Final render-ready list:
  // - Empty search query -> strictly sorted A-Z by English word (Stage 1 Prep Cards only)
  // - Active search query -> Stage 1 Prep Cards prioritized first, then Stage 2 Offline Dictionary, then Stage 3 Online API
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
        // Keep Stage 1 Prep Cards ahead of Stage 2 Offline Dictionary unless Stage 2 is an exact match
        const aIsOffline = Boolean(a.isOfflineDict);
        const bIsOffline = Boolean(b.isOfflineDict);
        const priorityA = getSearchMatchPriority(a, queryLower, normQuery);
        const priorityB = getSearchMatchPriority(b, queryLower, normQuery);

        if (aIsOffline !== bIsOffline) {
          // If one is Stage 1 (Prep Card) and the other is Stage 2 (Offline), prefer Stage 1 first
          // unless Stage 2 is an exact match while Stage 1 is not
          const aExact = priorityA >= 95;
          const bExact = priorityB >= 95;
          if (aExact !== bExact) return bExact ? 1 : -1;
          return aIsOffline ? 1 : -1;
        }

        const priorityDiff = priorityB - priorityA;
        if (priorityDiff !== 0) return priorityDiff;
        return a.word.trim().localeCompare(b.word.trim(), 'en', { sensitivity: 'base' });
      });

    if (onlineResults.length > 0 && !hasExactLocalMatch) {
      const onlineWordSet = new Set(onlineResults.map((w) => w.word.toLowerCase().trim()));
      const remainingLocal = localMatches.filter(
        (w) => !onlineWordSet.has(w.word.toLowerCase().trim())
      );
      return [...sortBySearchPriority(remainingLocal), ...onlineResults];
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
                const isOnlineEntry = Boolean(item.isOnlineDict || item.id.startsWith('online_'));
                const hasCollocations = Boolean(
                  !isOnlineEntry &&
                  Array.isArray(item.collocations) &&
                  item.collocations.length > 0 &&
                  item.collocations.some((c) => typeof c === 'string' && c.trim().length > 0)
                );
                const hasTip = Boolean(
                  item.academicNote &&
                  item.academicNote.trim().length > 0 &&
                  !item.isGeneralDict &&
                  !isOnlineEntry
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
                        {/* Example sentence with English Audio (only if a real example exists) */}
                        {item.enExample && item.enExample.trim().length > 0 && (
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
                            {item.trExample && item.trExample.trim().length > 0 && (
                              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic">
                                &quot;{item.trExample}&quot;
                              </p>
                            )}
                          </div>
                        )}

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
          <div
            ref={searchBoxContainerRef}
            className="scroll-mt-20 bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 border border-[#e2e8f0] dark:border-[#334155] shadow-sm transition-colors space-y-4"
          >
        {/* Instant Search Bar with Mobile Keyboard Alignment & Live Autocomplete Pop-up */}
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
                ensureOfflineDictionaryLoaded();
              }}
              onFocus={() => {
                setIsInputFocused(true);
                setShowSuggestions(true);
                ensureOfflineDictionaryLoaded();
                // Smoothly scroll search box near the top so mobile keyboards never cover it or the pop-up
                setTimeout(() => {
                  searchBoxContainerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 120);
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

          {/* Live Autocomplete Floating Pop-up (TOP 8 compact rows, or Did You Mean fallback on 0 matches) */}
          {showSuggestions &&
            isInputFocused &&
            searchQuery.trim().length >= 1 &&
            (suggestions.length > 0 || didYouMeanSuggestions.length > 0) && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#FFFFFF] dark:bg-[#1E293B] rounded-2xl shadow-2xl border-2 border-[#B4C6A6] dark:border-[#334155] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {suggestions.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto divide-y divide-[#E2F0D9] dark:divide-[#334155]">
                  {suggestions.map((item, index) => {
                    const isSelected = activeSuggestionIndex === index;
                    const primaryPosTag = item.offlinePosLabel
                      ? item.offlinePosLabel.split(',')[0].trim()
                      : getPosTurkishLabel(item.partOfSpeech);
                    return (
                      <li
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(item);
                        }}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E2F0D9] dark:bg-[#0F172A]'
                            : 'hover:bg-[#F3F8EE] dark:hover:bg-[#0F172A]'
                        }`}
                      >
                        <div className="flex items-center gap-2 shrink-0 max-w-[58%] min-w-0">
                          <span className="font-bold font-['Outfit'] text-[#0E2F0E] dark:text-[#F8FAFC] text-sm truncate">
                            {item.word}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 leading-tight ${getPosBadgeClass(
                              item.partOfSpeech
                            )}`}
                          >
                            {primaryPosTag}
                          </span>
                        </div>
                        <span className="text-xs text-[#475569] dark:text-[#94A3B8] truncate text-right min-w-0 flex-1">
                          {item.trMeaning}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-3 space-y-2 bg-[#FFFFFF] dark:bg-[#1E293B]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0E2F0E] dark:text-[#F8FAFC]">
                    <Sparkles
                      width={13}
                      height={13}
                      fill="none"
                      stroke="currentColor"
                      className="w-3.5 h-3.5 text-[#388E3C] dark:text-[#818CF8] shrink-0"
                    />
                    <span>Bunu mu demek istediniz?</span>
                  </div>
                  <ul className="divide-y divide-[#E2F0D9] dark:divide-[#334155] rounded-xl border border-[#B4C6A6] dark:border-[#334155] overflow-hidden">
                    {didYouMeanSuggestions.map((item) => (
                      <li
                        key={item.word}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectDidYouMean(item.word);
                        }}
                        className="px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer bg-[#FFFFFF] dark:bg-[#0F172A] hover:bg-[#E2F0D9] dark:hover:bg-[#334155] transition-colors"
                      >
                        <span className="font-bold font-['Outfit'] text-[#0E2F0E] dark:text-[#F8FAFC] text-sm shrink-0">
                          {item.word}
                        </span>
                        <span className="text-xs text-[#475569] dark:text-[#94A3B8] truncate text-right">
                          {item.trMeaning}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Immediate Feedback Card right below the Search Bar when no local prefix/exact match exists (>= 2 chars) */}
        {!hasExactLocalMatch &&
          localMatches.length === 0 &&
          onlineResults.length === 0 &&
          searchQuery.trim().length >= 2 && (
          <div className="pt-1 space-y-2.5">
            {/* Offline Levenshtein "Bunu mu demek istediniz?" Interactive Suggestion Box */}
            {didYouMeanSuggestions.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-5 bg-[#E2F0D9] dark:bg-[#0F172A] border border-[#B4C6A6] dark:border-[#334155] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Sparkles
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4 shrink-0 text-[#388E3C] dark:text-[#10B981]"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[#0E2F0E] dark:text-[#F8FAFC]">
                    Bunu mu demek istediniz?
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {didYouMeanSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.word}
                      type="button"
                      onClick={() => handleSelectDidYouMean(suggestion.word)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#B4C6A6] dark:border-[#334155] text-xs sm:text-sm font-bold text-[#0E2F0E] dark:text-[#F8FAFC] hover:bg-[#388E3C] hover:text-[#FFFFFF] hover:border-[#388E3C] dark:hover:bg-[#4F46E5] dark:hover:text-[#FFFFFF] dark:hover:border-[#4F46E5] transition-colors cursor-pointer"
                    >
                      <span className="font-['Outfit']">{suggestion.word}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            ) : isOnlineLoading || !isOfflineDictLoaded || onlineErrorReason === null ? (
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

          {/* Source / Loading Status Line (only shown for online or offline general dictionary searches) */}
          {(isOnlineLoading || isFromOnlineDict || isFromOfflineDict) && (
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
                    Yerel sözlüklerde bulunamadı, <strong className="font-bold">Çevrimiçi Sözlük 🌐</strong> üzerinden sonuç gösteriliyor
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-[#2E7D32] dark:text-[#10B981]">
                  <BookOpen width={14} height={14} fill="none" stroke="currentColor" className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Hazırlık kartlarında bulunamadı, <strong className="font-bold">Çevrimdışı Sözlük 📖</strong> üzerinden sonuç gösteriliyor
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
            const isOnlineEntry = Boolean(item.isOnlineDict || item.id.startsWith('online_'));
            const isOfflineEntry = Boolean(item.isOfflineDict || item.id.startsWith('offline_'));
            const hasCollocations = Boolean(
              !isOnlineEntry &&
              !isOfflineEntry &&
              Array.isArray(item.collocations) &&
              item.collocations.length > 0 &&
              item.collocations.some((c) => typeof c === 'string' && c.trim().length > 0)
            );
            const hasTip = Boolean(
              item.academicNote &&
              item.academicNote.trim().length > 0 &&
              !item.isGeneralDict &&
              !isOnlineEntry &&
              !isOfflineEntry
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
                      {/* CEFR Badge or Offline/Online Sözlük Badge */}
                      {isOnlineEntry ? (
                        <>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#f0fdfa] dark:bg-[#042f2e] text-[#0f766e] dark:text-[#5eead4] border border-[#5eead4] dark:border-[#115e59] flex items-center gap-1">
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
                      ) : isOfflineEntry ? (
                        <>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#E2F0D9] dark:bg-[#0F172A] text-[#0E2F0E] dark:text-[#F8FAFC] border border-[#B4C6A6] dark:border-[#334155] flex items-center gap-1">
                            <span>Çevrimdışı Sözlük 📖</span>
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-lg ${getPosBadgeClass(
                              item.partOfSpeech
                            )}`}
                          >
                            {item.offlinePosLabel || getPosTurkishLabel(item.partOfSpeech)}
                          </span>
                        </>
                      ) : item.isGeneralDict ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#f0f9ff] dark:bg-[#082f49] text-[#0369a1] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985] flex items-center gap-1">
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

                    {/* Verb Forms (V1 / V2 / V3) or Regular Verb Badge (Prep Cards only) */}
                    {!isOfflineEntry && (
                      <VerbConjugationBadge
                        word={item.word}
                        type={item.type}
                        partOfSpeech={item.partOfSpeech}
                      />
                    )}
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
                <div className="mt-4 pt-3.5 border-t border-[#f1f5f9] dark:border-[#334155]">
                  <p className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-[#f8fafc]">
                    {item.trMeaning}
                  </p>
                </div>

                {/* Clean Offline Dictionary Card (word + badge + type + meaning ONLY) vs General vs Rich Prep Card */}
                {isOfflineEntry ? null : item.isGeneralDict ? (
                  <div className="mt-3.5 py-2.5 px-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] text-xs text-[#475569] dark:text-[#94a3b8] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] shrink-0" />
                    <span>Temel sözlük kaydı (Hazırlık kartı bulunmamaktadır).</span>
                  </div>
                ) : (
                  <>
                    {/* English Example Sentence (WITH ENGLISH AUDIO) & Turkish Translation (only shown if a real example exists) */}
                    {item.enExample && item.enExample.trim().length > 0 && (
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
                        {item.trExample && item.trExample.trim().length > 0 && (
                          <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] italic">
                            &quot;{item.trExample}&quot;
                          </p>
                        )}
                      </div>
                    )}

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
