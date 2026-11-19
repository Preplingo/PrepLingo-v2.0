import { WordEntry, PartOfSpeech } from '../types';

export interface OnlineLookupResponse {
  result: WordEntry | null;
  status: 'success' | 'not_found' | 'offline' | 'network_error';
}

const SESSION_CACHE_PREFIX = 'preplingo_online_dict_v2_';

// In-memory cache for instant re-lookup during the session
const memoryCache = new Map<string, WordEntry>();

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

function cleanTurkishTranslation(rawText: string | undefined, sourceWord: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  // Filter out MyMemory quota/warning error strings
  if (
    upper.includes('MYMEMORY WARNING') ||
    upper.includes('PLEASE SELECT TWO DISTINCT LANGUAGES') ||
    upper.includes('QUERY LENGTH LIMIT')
  ) {
    return '';
  }
  // If translation just echoed the exact English word with no change, discard
  if (trimmed.toLowerCase() === sourceWord.toLowerCase()) {
    return '';
  }
  return trimmed;
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
 * Retrieve a previously fetched online word synchronously from memory or sessionStorage.
 */
export function getCachedOnlineWord(word: string): WordEntry | null {
  const key = normalizeOnlineKey(word);
  if (!key) return null;

  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`);
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
      window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // ignore storage quota errors
    }
  }
}

/**
 * Tier 3 Automatic Online Dictionary Lookup:
 * Queries Free Dictionary API (English phonetic, POS, academic definition, example)
 * and MyMemory Translation API (Turkish meaning) in parallel, caching results in memory + sessionStorage.
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

  // 1. Check in-memory / session cache first for instant result
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
    const trPromise = fetch(
      `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|tr`,
      { signal }
    ).catch(() => null);

    const [dictRes, trRes] = await Promise.all([dictPromise, trPromise]);

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

    // Extract primary English academic definition and example sentence
    let enDefinition = '';
    let enExample = '';
    const synonymsList: string[] = [];

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
      if (Array.isArray(m.synonyms)) {
        for (const s of m.synonyms) {
          if (typeof s === 'string' && s.trim() && synonymsList.length < 4 && !synonymsList.includes(s.trim())) {
            synonymsList.push(s.trim());
          }
        }
      }
    }

    // Extract optional Turkish translation from MyMemory
    let trMeaning = '';
    if (trRes && trRes.ok) {
      try {
        const trJson = await trRes.json();
        trMeaning = cleanTurkishTranslation(trJson?.responseData?.translatedText, cleanWord);

        // If responseData was empty or identical, try matches array for a better quality match
        if (!trMeaning && Array.isArray(trJson?.matches)) {
          for (const match of trJson.matches) {
            const candidate = cleanTurkishTranslation(match?.translation, cleanWord);
            if (candidate) {
              trMeaning = candidate;
              break;
            }
          }
        }
      } catch {
        // Ignore Turkish API parse errors; English academic definition is still shown
      }
    }

    if (partOfSpeech === 'verb' && trMeaning) {
      trMeaning = appendTurkishInfinitive(trMeaning);
    }

    const displayWord = (firstEntry.word || cleanWord).trim();
    const finalMeaning = trMeaning || enDefinition || displayWord;
    const finalExampleEn =
      enExample || `The word "${displayWord}" is used in English academic and general contexts.`;

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
      enDefinition: enDefinition || undefined,
      enExample: finalExampleEn,
      exampleEn: finalExampleEn,
      trExample: trMeaning
        ? `Çevrimiçi sözlük karşılığı: ${trMeaning}`
        : 'Çevrimiçi sözlükten alınan örnek cümle.',
      exampleTr: trMeaning
        ? `Çevrimiçi sözlük karşılığı: ${trMeaning}`
        : 'Çevrimiçi sözlükten alınan örnek cümle.',
      collocations: synonymsList.length > 0 ? synonymsList : undefined,
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
