import { WordEntry, PartOfSpeech } from '../types';

export interface OnlineLookupResponse {
  result: WordEntry | null;
  status: 'success' | 'not_found' | 'offline' | 'network_error';
}

const CACHE_KEY_PREFIX = 'preplingo_online_dict_v4_';
const LEGACY_CACHE_PREFIXES = [
  'preplingo_online_dict_v1_',
  'preplingo_online_dict_v2_',
  'preplingo_online_dict_v3_',
  'preplingo_online_cache_',
];

// In-memory cache for instant re-lookup during the session
const memoryCache = new Map<string, WordEntry>();

/**
 * Purges any stale/legacy online dictionary cache entries from localStorage & sessionStorage
 * so previously cached broken entries (with template sentences or untranslated English definitions)
 * are never served again.
 */
export function purgeLegacyOnlineDictionaryCache(): void {
  if (typeof window === 'undefined') return;
  const storages: Array<Storage | undefined> = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    if (!storage) continue;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (LEGACY_CACHE_PREFIXES.some((prefix) => k.startsWith(prefix))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        storage.removeItem(k);
      }
    } catch {
      // Ignore storage access restrictions
    }
  }
}

// Run legacy cache cleanup immediately on module load
purgeLegacyOnlineDictionaryCache();

function normalizeOnlineKey(word: string): string {
  return word.toLowerCase().trim();
}

function mapApiPartOfSpeech(rawPos?: string): PartOfSpeech {
  const pos = (rawPos || '').toLowerCase().trim();
  if (pos === 'verb') return 'verb';
  if (pos === 'adjective' || pos === 'adj') return 'adjective';
  if (pos === 'adverb' || pos === 'adv') return 'adverb';
  if (pos === 'preposition') return 'preposition';
  if (pos === 'conjunction') return 'conjunction';
  return 'noun';
}

function cleanTurkishTranslation(rawText: string | undefined, sourceText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  // Filter out MyMemory quota/warning error strings
  if (
    upper.includes('MYMEMORY WARNING') ||
    upper.includes('PLEASE SELECT TWO DISTINCT LANGUAGES') ||
    upper.includes('QUERY LENGTH LIMIT') ||
    upper.includes('INVALID LANGUAGE PAIR') ||
    upper.includes('NO QUERY SPECIFIED')
  ) {
    return '';
  }
  // If translation just echoed the exact English source text with no change, discard
  const normTranslated = trimmed.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, '');
  const normSource = sourceText.toLowerCase().replace(/[^a-z0-9çğıöşü]/g, '');
  if (!normTranslated || normTranslated === normSource) {
    return '';
  }
  return trimmed;
}

/**
 * Translates an English word or sentence/definition into Turkish via MyMemory API.
 */
async function translateEnToTr(text: string, signal?: AbortSignal): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) return '';

  // MyMemory GET query limit safety (~450 chars)
  const boundedText = cleanText.length > 420 ? cleanText.slice(0, 420) : cleanText;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(boundedText)}&langpair=en|tr`,
      { signal }
    );
    if (!res.ok) return '';
    const json = await res.json();

    let translated = cleanTurkishTranslation(json?.responseData?.translatedText, boundedText);
    if (!translated && Array.isArray(json?.matches)) {
      for (const match of json.matches) {
        const candidate = cleanTurkishTranslation(match?.translation, boundedText);
        if (candidate) {
          translated = candidate;
          break;
        }
      }
    }
    return translated;
  } catch {
    return '';
  }
}

/**
 * Appends the Turkish infinitive suffix (-mak / -mek) to verb translations
 * using Turkish vowel harmony when not already ending with mak/mek.
 */
function appendTurkishInfinitive(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const backVowels = new Set(['a', 'ı', 'o', 'u', 'â', 'û']);
  const frontVowels = new Set(['e', 'i', 'ö', 'ü', 'î']);

  return trimmed
    .split(/([,;])/)
    .map((part) => {
      if (part === ',' || part === ';') return part;
      const seg = part.trim();
      if (!seg) return part;

      const cleanSeg = seg.replace(/[.!?]+$/, '').trim();
      if (!cleanSeg || cleanSeg.split(/\s+/).length > 4) {
        return seg;
      }

      const cleanLower = cleanSeg.toLocaleLowerCase('tr-TR');
      if (cleanLower.endsWith('mak') || cleanLower.endsWith('mek')) {
        return seg;
      }

      let suffix: 'mak' | 'mek' = 'mek';
      for (let i = cleanLower.length - 1; i >= 0; i--) {
        const ch = cleanLower[i];
        if (backVowels.has(ch)) {
          suffix = 'mak';
          break;
        }
        if (frontVowels.has(ch)) {
          suffix = 'mek';
          break;
        }
      }

      const leadingWs = part.match(/^\s*/)?.[0] || '';
      return `${leadingWs}${cleanSeg}${suffix}`;
    })
    .join('');
}

/**
 * Retrieve a previously fetched online word synchronously from memory or sessionStorage (v3).
 */
export function getCachedOnlineWord(word: string): WordEntry | null {
  const key = normalizeOnlineKey(word);
  if (!key) return null;

  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as WordEntry;
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // ignore storage parse error
    }
  }

  return null;
}

function cacheOnlineWord(word: string, entry: WordEntry): void {
  const key = normalizeOnlineKey(word);
  if (!key) return;

  memoryCache.set(key, entry);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // ignore storage quota errors
    }
  }
}

/**
 * Tier 3 Automatic Online Dictionary Lookup:
 * Queries Free Dictionary API (phonetic, POS, definition, real example if available)
 * and MyMemory Translation API (Turkish meaning + Turkish-translated definition & example).
 * Never injects synthetic template sentences or collocations from API synonyms.
 */
export async function lookupOnlineDictionary(
  query: string,
  signal?: AbortSignal
): Promise<OnlineLookupResponse> {
  const cleanWord = query.trim();
  const key = normalizeOnlineKey(cleanWord);
  if (key.length < 2) {
    return { result: null, status: 'not_found' };
  }

  // 1. Check in-memory / v3 session cache first for instant result
  const cached = getCachedOnlineWord(key);
  if (cached) {
    return { result: cached, status: 'success' };
  }

  // 2. Check navigator.onLine status before issuing network requests
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { result: null, status: 'offline' };
  }

  try {
    const encoded = encodeURIComponent(cleanWord);
    const dictPromise = fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`,
      { signal }
    );
    const trWordPromise = translateEnToTr(cleanWord, signal);

    const [dictRes, initialTrMeaning] = await Promise.all([dictPromise, trWordPromise]);

    if (signal?.aborted) {
      return { result: null, status: 'network_error' };
    }

    if (dictRes.status === 404) {
      return { result: null, status: 'not_found' };
    }

    if (!dictRes.ok) {
      return { result: null, status: 'network_error' };
    }

    const dictJson = await dictRes.json();
    if (!Array.isArray(dictJson) || dictJson.length === 0) {
      return { result: null, status: 'not_found' };
    }

    const firstEntry = dictJson[0];
    const meanings = Array.isArray(firstEntry.meanings) ? firstEntry.meanings : [];
    const firstMeaning = meanings[0];

    // Extract phonetic
    let phoneticText = '';
    if (typeof firstEntry.phonetic === 'string' && firstEntry.phonetic.trim()) {
      phoneticText = firstEntry.phonetic.trim();
    } else if (Array.isArray(firstEntry.phonetics)) {
      const foundPhonetic = firstEntry.phonetics.find(
        (p: any) => typeof p?.text === 'string' && p.text.trim().length > 0
      );
      if (foundPhonetic) phoneticText = foundPhonetic.text.trim();
    }

    // Extract Part of Speech
    const partOfSpeech = mapApiPartOfSpeech(firstMeaning?.partOfSpeech);

    // Extract primary English definition and real example sentence (if available)
    let enDefinition = '';
    let enExample = '';

    for (const m of meanings) {
      const defs = Array.isArray(m.definitions) ? m.definitions : [];
      for (const d of defs) {
        if (!enDefinition && typeof d?.definition === 'string' && d.definition.trim()) {
          enDefinition = d.definition.trim();
        }
        if (!enExample && typeof d?.example === 'string' && d.example.trim()) {
          enExample = d.example.trim();
        }
        if (enDefinition && enExample) break;
      }
      if (enDefinition && enExample) break;
    }

    // Translate real example sentence to Turkish (and only translate definition as fallback if word translation failed)
    const [translatedEx, fallbackDefMeaning] = await Promise.all([
      enExample ? translateEnToTr(enExample, signal) : Promise.resolve(''),
      !initialTrMeaning && enDefinition ? translateEnToTr(enDefinition, signal) : Promise.resolve(''),
    ]);

    if (signal?.aborted) {
      return { result: null, status: 'network_error' };
    }

    let trMeaning = initialTrMeaning;
    if (partOfSpeech === 'verb' && trMeaning) {
      trMeaning = appendTurkishInfinitive(trMeaning);
    }

    const displayWord = (firstEntry.word || cleanWord).trim();
    const finalMeaning = trMeaning || fallbackDefMeaning || displayWord;

    const wordEntry: WordEntry = {
      id: `online_${key.replace(/[^a-z0-9]/g, '_')}`,
      word: displayWord,
      phonetic: phoneticText || `/${displayWord}/`,
      partOfSpeech,
      type: partOfSpeech === 'adjective' ? 'adj' : partOfSpeech === 'adverb' ? 'adv' : partOfSpeech,
      cefrLevel: 'Genel',
      level: 'Genel',
      trMeaning: finalMeaning,
      meaning: finalMeaning,
      trDefinition: undefined,
      enExample: enExample,
      exampleEn: enExample,
      trExample: enExample ? translatedEx : '',
      exampleTr: enExample ? translatedEx : '',
      collocations: undefined,
      isCustom: false,
      isFavorite: false,
      isGeneralDict: false,
      isOnlineDict: true,
      status: 'calisiliyor',
    };

    cacheOnlineWord(key, wordEntry);
    return { result: wordEntry, status: 'success' };
  } catch (err: any) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      return { result: null, status: 'network_error' };
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { result: null, status: 'offline' };
    }
    return { result: null, status: 'network_error' };
  }
}
