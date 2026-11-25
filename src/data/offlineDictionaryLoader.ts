import { WordEntry, PartOfSpeech, CefrLevel } from '../types';
import { INITIAL_WORDS } from './initialWords';
import { normalizeForSearch } from '../utils/turkishSearch';

/**
 * Schema of each entry in public/sozluk.json:
 * { "w": "banana", "p": "İsim", "t": "muz" }
 */
export interface RawOfflineDictionaryItem {
  w: string; // English word
  p?: string; // Part of speech (Turkish or English: "İsim", "Fiil", "Sıfat", "Zarf", etc.)
  t: string; // Turkish meaning
}

interface IndexedOfflineItem {
  w: string;
  wLower: string;
  wNorm: string;
  pLabel: string;
  pos: PartOfSpeech;
  t: string;
  tRawTokens: string[];
  tNormTokens: string[];
}

/**
 * Fast O(1) lookup Set containing all lowercase English words in the 2,575 Prep Cards pool.
 * Any word from public/sozluk.json found in this Set is strictly ignored so there is ZERO duplication.
 */
export const PREP_CARD_WORD_SET: Set<string> = new Set(
  INITIAL_WORDS.map((item) => item.word.trim().toLowerCase()).filter(Boolean)
);

function mapOfflinePartOfSpeech(rawPos?: string): { pos: PartOfSpeech; label: string } {
  const cleaned = (rawPos || '').trim();
  const tokens = cleaned
    .toLocaleLowerCase('tr-TR')
    .split(/[,;/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const first = tokens[0] || '';

  if (first === 'fiil' || first === 'verb' || first === 'v') {
    return { pos: 'verb', label: cleaned || 'Fiil' };
  }
  if (first === 'sıfat' || first === 'sifat' || first === 'adjective' || first === 'adj') {
    return { pos: 'adjective', label: cleaned || 'Sıfat' };
  }
  if (first === 'zarf' || first === 'belirteç' || first === 'adverb' || first === 'adv') {
    return { pos: 'adverb', label: cleaned || 'Zarf' };
  }
  if (first === 'edat' || first === 'ilgeç' || first === 'preposition' || first === 'prep') {
    return { pos: 'preposition', label: cleaned || 'Edat' };
  }
  if (first === 'bağlaç' || first === 'baglac' || first === 'conjunction' || first === 'conj') {
    return { pos: 'conjunction', label: cleaned || 'Bağlaç' };
  }
  if (first === 'isim' || first === 'ad' || first === 'noun' || first === 'n') {
    return { pos: 'noun', label: cleaned || 'İsim' };
  }

  return { pos: 'noun', label: cleaned || 'İsim' };
}

function createOfflineWordEntry(item: IndexedOfflineItem): WordEntry {
  const shortType: PartOfSpeech =
    item.pos === 'adjective' ? 'adj' : item.pos === 'adverb' ? 'adv' : item.pos;

  return {
    id: `offline_${item.wLower.replace(/[^a-z0-9]/g, '_')}`,
    word: item.w,
    phonetic: undefined,
    partOfSpeech: item.pos,
    type: shortType,
    cefrLevel: 'Genel' as CefrLevel,
    level: 'Genel' as CefrLevel,
    trMeaning: item.t,
    meaning: item.t,
    enExample: '',
    exampleEn: '',
    trExample: '',
    exampleTr: '',
    academicNote: undefined,
    prepExamTip: undefined,
    collocations: undefined,
    isCustom: false,
    isFavorite: false,
    isGeneralDict: false,
    isOfflineDict: true,
    offlinePosLabel: item.pLabel,
    isOnlineDict: false,
    status: 'calisiliyor',
  };
}

function tokenizeMeaningRaw(text: string): string[] {
  return text
    .toLocaleLowerCase('tr-TR')
    .split(/[^a-z0-9çğıöşüâîû]+/i)
    .filter(Boolean);
}

/**
 * Asynchronous background loader & deduplicated index for external public/sozluk.json.
 * Designed to handle 25,000+ entries smoothly without blocking app startup.
 */
class ExternalOfflineDictionary {
  private items: IndexedOfflineItem[] = [];
  private byWordMap = new Map<string, IndexedOfflineItem>();
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const startBackgroundLoad = () => {
        // Non-blocking background fetch right after initial render
        setTimeout(() => {
          this.load().catch(() => {});
        }, 50);
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startBackgroundLoad();
      } else {
        window.addEventListener('DOMContentLoaded', startBackgroundLoad, { once: true });
      }
    }
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const res = await fetch('/sozluk.json', { cache: 'default' });
        if (!res.ok) {
          this.isLoaded = true;
          this.notifyListeners();
          return;
        }

        const rawData = await res.json();
        if (!Array.isArray(rawData)) {
          this.isLoaded = true;
          this.notifyListeners();
          return;
        }

        const indexed: IndexedOfflineItem[] = [];
        const map = new Map<string, IndexedOfflineItem>();

        for (let i = 0; i < rawData.length; i++) {
          const entry = rawData[i] as RawOfflineDictionaryItem;
          if (!entry || typeof entry.w !== 'string' || typeof entry.t !== 'string') continue;

          const wClean = entry.w.trim();
          const tClean = entry.t.trim();
          if (!wClean || !tClean) continue;

          const wLower = wClean.toLowerCase();

          // STRICT COLLISION PREVENTION:
          // Ignore completely if the word already exists in the 2,575 Prep Cards Set
          if (PREP_CARD_WORD_SET.has(wLower)) continue;

          // Also prevent duplicates inside public/sozluk.json itself
          if (map.has(wLower)) continue;

          const { pos, label } = mapOfflinePartOfSpeech(entry.p);
          const wNorm = normalizeForSearch(wClean);
          const tRawTokens = tokenizeMeaningRaw(tClean);
          const tNormTokens = normalizeForSearch(tClean).split(' ').filter(Boolean);

          const item: IndexedOfflineItem = {
            w: wClean,
            wLower,
            wNorm,
            pLabel: label,
            pos,
            t: tClean,
            tRawTokens,
            tNormTokens,
          };

          indexed.push(item);
          map.set(wLower, item);
        }

        this.items = indexed;
        this.byWordMap = map;
        this.isLoaded = true;
        this.notifyListeners();
      } catch (err) {
        console.error('Error loading external public/sozluk.json:', err);
        this.isLoaded = true;
        this.notifyListeners();
      }
    })();

    return this.loadPromise;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  public getCount(): number {
    return this.items.length;
  }

  public getEntriesForSuggestions(): ReadonlyArray<{ w: string; wLower: string; t: string }> {
    return this.items;
  }

  public getEntriesForExport(): ReadonlyArray<{
    w: string;
    wLower: string;
    pLabel: string;
    pos: PartOfSpeech;
    t: string;
  }> {
    return this.items;
  }

  /**
   * O(1) exact lookup in deduplicated public/sozluk.json.
   */
  public findExact(word: string, extraExcludedSet?: Set<string>): WordEntry | null {
    if (!word) return null;
    const key = word.trim().toLowerCase();
    if (!key || PREP_CARD_WORD_SET.has(key) || extraExcludedSet?.has(key)) {
      return null;
    }

    if (!this.isLoaded) {
      this.load();
      return null;
    }

    const found = this.byWordMap.get(key);
    return found ? createOfflineWordEntry(found) : null;
  }

  /**
   * High-speed prefix & word-start search across public/sozluk.json (25,000+ ready).
   * Strictly excludes any word present in PREP_CARD_WORD_SET or extraExcludedSet.
   * Priority: (1) Exact English match, (2) English word prefix, (3) Turkish meaning word-start.
   */
  public search(
    query: string,
    maxResults = 30,
    extraExcludedSet?: Set<string>
  ): WordEntry[] {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    if (!this.isLoaded) {
      this.load();
      return [];
    }

    const queryLower = trimmed.toLowerCase();
    const queryTrLower = trimmed.toLocaleLowerCase('tr-TR');
    const normQuery = normalizeForSearch(trimmed);
    if (!normQuery) return [];

    const exactMatches: WordEntry[] = [];
    const prefixMatches: WordEntry[] = [];
    const turkishMatches: WordEntry[] = [];

    // 1. O(1) exact English lookup
    const exactItem = this.byWordMap.get(queryLower);
    if (
      exactItem &&
      !PREP_CARD_WORD_SET.has(exactItem.wLower) &&
      !extraExcludedSet?.has(exactItem.wLower)
    ) {
      exactMatches.push(createOfflineWordEntry(exactItem));
    }

    const isSingleWord = !normQuery.includes(' ');
    const queryTokens = isSingleWord ? [normQuery] : normQuery.split(' ').filter(Boolean);

    // 2. Scan indexed items for English prefix & Turkish meaning word-start matches
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.wLower === queryLower) continue;
      if (PREP_CARD_WORD_SET.has(item.wLower) || extraExcludedSet?.has(item.wLower)) continue;

      if (item.wLower.startsWith(queryLower) || item.wNorm.startsWith(normQuery)) {
        if (prefixMatches.length < maxResults) {
          prefixMatches.push(createOfflineWordEntry(item));
        }
      } else if (turkishMatches.length < maxResults) {
        let matchedTr = false;
        if (isSingleWord) {
          matchedTr =
            item.tRawTokens.some((tok) => tok.startsWith(queryTrLower)) ||
            item.tNormTokens.some((tok) => tok.startsWith(normQuery));
        } else {
          matchedTr = queryTokens.every((qt) =>
            item.tNormTokens.some((tok) => tok.startsWith(qt))
          );
        }

        if (matchedTr) {
          turkishMatches.push(createOfflineWordEntry(item));
        }
      }

      if (
        exactMatches.length > 0 &&
        prefixMatches.length >= maxResults &&
        turkishMatches.length >= maxResults
      ) {
        break;
      }
    }

    return [...exactMatches, ...prefixMatches, ...turkishMatches].slice(0, maxResults);
  }
}

export const offlineDictionary = new ExternalOfflineDictionary();

export function searchOfflineDictionary(
  query: string,
  maxResults = 30,
  extraExcludedSet?: Set<string>
): WordEntry[] {
  return offlineDictionary.search(query, maxResults, extraExcludedSet);
}

export function findExactInOfflineDictionary(
  word: string,
  extraExcludedSet?: Set<string>
): WordEntry | null {
  return offlineDictionary.findExact(word, extraExcludedSet);
}

export function ensureOfflineDictionaryLoaded(): Promise<void> {
  return offlineDictionary.load();
}
