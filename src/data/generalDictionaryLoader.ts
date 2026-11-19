import { WordEntry, CefrLevel } from '../types';
import { normalizeForSearch } from '../utils/turkishSearch';

/**
 * Creates an application WordEntry from a general dictionary word and translation.
 */
export function createGeneralWordEntry(word: string, meaning: string): WordEntry {
  const wordClean = (word || '').trim();

  return {
    id: `gen_${wordClean.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    word: wordClean,
    phonetic: `/${wordClean}/`,
    partOfSpeech: 'noun',
    type: 'noun',
    cefrLevel: 'Genel' as CefrLevel,
    level: 'Genel' as CefrLevel,
    trMeaning: meaning,
    meaning: meaning,
    enExample: `The word "${wordClean}" is commonly found in general English texts and vocabulary.`,
    exampleEn: `The word "${wordClean}" is commonly found in general English texts and vocabulary.`,
    trExample: `"${wordClean}" kelimesi genel İngilizce metinlerde ve günlük dilde kullanılır.`,
    exampleTr: `"${wordClean}" kelimesi genel İngilizce metinlerde ve günlük dilde kullanılır.`,
    academicNote: 'Temel sözlük kaydı (Hazırlık kartı bulunmamaktadır).',
    prepExamTip: 'Temel sözlük kaydı (Hazırlık kartı bulunmamaktadır).',
    collocations: [],
    isCustom: false,
    isFavorite: false,
    isGeneralDict: true,
    status: 'calisiliyor',
  };
}

class LazyGeneralDictionary {
  private map: Map<string, string> | null = null;
  private keys: string[] = [];
  private loadPromise: Promise<Map<string, string>> | null = null;
  private isLoaded = false;
  private listeners: Array<() => void> = [];

  constructor() {
    // Schedule lazy background loading after initial rendering/splash screen completes
    if (typeof window !== 'undefined') {
      const schedulePreload = () => {
        // Preload general dictionary in background promptly
        setTimeout(() => {
          this.load().catch(() => {});
        }, 200);
      };

      if (document.readyState === 'complete') {
        schedulePreload();
      } else {
        window.addEventListener('load', schedulePreload, { once: true });
      }
    }
  }

  /**
   * Lazily loads the general dictionary JSON bundle on demand.
   * Returns a fast memory Map of 30,000+ words.
   */
  public async load(): Promise<Map<string, string>> {
    if (this.map) return this.map;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const module = await import('./generalDictionary.json');
        const rawObj: Record<string, string> = module.default || module;
        const newMap = new Map<string, string>();
        const newKeys = Object.keys(rawObj);

        for (let i = 0; i < newKeys.length; i++) {
          const k = newKeys[i];
          newMap.set(k.toLowerCase(), rawObj[k]);
        }

        this.map = newMap;
        this.keys = newKeys;
        this.isLoaded = true;

        // Notify subscribers (components re-render seamlessly)
        this.notifyListeners();
        return newMap;
      } catch (err) {
        console.error('Error lazy loading general dictionary:', err);
        this.map = new Map();
        this.isLoaded = true;
        this.notifyListeners();
        return this.map;
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

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('General dictionary subscriber error:', e);
      }
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Fast O(1) exact match lookup
   */
  public findExact(word: string): WordEntry | null {
    if (!word) return null;
    const lower = word.trim().toLowerCase();

    // Trigger load if not loaded yet
    if (!this.map) {
      this.load();
      return null;
    }

    const meaning = this.map.get(lower);
    if (!meaning) return null;

    return createGeneralWordEntry(word, meaning);
  }

  /**
   * Fast prefix and substring search across the 30,000+ word dictionary
   */
  public search(query: string, maxResults = 25): WordEntry[] {
    const trimmed = (query || '').trim().toLowerCase();
    if (!trimmed) return [];

    // Trigger load if not loaded yet
    if (!this.map) {
      this.load();
      return [];
    }

    const normQuery = normalizeForSearch(trimmed);
    const exactMatches: WordEntry[] = [];
    const prefixMatches: WordEntry[] = [];
    const substringMatches: WordEntry[] = [];

    // Fast exact match first
    const exactMeaning = this.map.get(trimmed);
    if (exactMeaning) {
      exactMatches.push(createGeneralWordEntry(trimmed, exactMeaning));
    }

    // Prefix and substring matches across keys
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      if (key === trimmed) continue;

      if (key.startsWith(trimmed)) {
        prefixMatches.push(createGeneralWordEntry(key, this.map.get(key) || ''));
        if (prefixMatches.length >= maxResults) break;
      } else if (normQuery.length >= 3 && key.includes(trimmed)) {
        if (substringMatches.length < 10) {
          substringMatches.push(createGeneralWordEntry(key, this.map.get(key) || ''));
        }
      }
    }

    return [...exactMatches, ...prefixMatches, ...substringMatches].slice(0, maxResults);
  }
}

// Global singleton instance
export const generalDictionary = new LazyGeneralDictionary();

export function searchGeneralDictionary(query: string, maxResults = 25): WordEntry[] {
  return generalDictionary.search(query, maxResults);
}

export function findExactInGeneralDictionary(word: string): WordEntry | null {
  return generalDictionary.findExact(word);
}

export function ensureGeneralDictionaryLoaded(): Promise<Map<string, string>> {
  return generalDictionary.load();
}
