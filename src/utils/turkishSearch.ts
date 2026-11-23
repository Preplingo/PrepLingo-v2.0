import { WordEntry } from '../types';

/**
 * Fast LRU-style cache for string normalization to avoid re-running regexes on 1000+ words.
 */
const normCache = new Map<string, string>();
const MAX_CACHE_SIZE = 4000;

/**
 * Utility to normalize Turkish and English strings for diacritic-tolerant prefix search.
 * Converts characters like ç, ğ, ı, ö, ş, ü to basic latin counterparts
 * and properly lowercases Turkish 'İ' and 'I'.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  const cached = normCache.get(text);
  if (cached !== undefined) return cached;

  const normalized = text
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normCache.size > MAX_CACHE_SIZE) {
    normCache.clear();
  }
  normCache.set(text, normalized);
  return normalized;
}

/**
 * Splits a string into lowercase Turkish/English word tokens for word-boundary prefix matching.
 */
function extractRawTokens(text: string): string[] {
  if (!text) return [];
  return text
    .toLocaleLowerCase('tr-TR')
    .split(/[^a-z0-9çğıöşüâîû]+/i)
    .filter(Boolean);
}

/**
 * Checks if search query matches any word start in target text (no mid-word .includes()).
 */
export function matchesQuery(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;

  const cleanQuery = query.trim().toLocaleLowerCase('tr-TR');
  const normQuery = normalizeForSearch(query);
  if (!normQuery) return true;

  const rawTokens = extractRawTokens(target);
  if (rawTokens.some((t) => t.startsWith(cleanQuery))) {
    return true;
  }

  const normTokens = normalizeForSearch(target).split(' ').filter(Boolean);
  return normTokens.some((t) => t.startsWith(normQuery));
}

/**
 * High-performance precomputed index for a WordEntry focusing STRICTLY on
 * the English headword and short Turkish meaning (no example sentences or long definitions).
 */
export interface WordSearchIndex {
  id: string;
  wordLower: string;
  wordNorm: string;
  wordTokens: string[];
  meaningLower: string;
  meaningNorm: string;
  meaningRawTokens: string[];
  meaningNormTokens: string[];
  meaningSensesLower: string[];
  meaningSensesNorm: string[];
}

const wordIndexCache = new WeakMap<WordEntry, WordSearchIndex>();

export function getWordSearchIndex(word: WordEntry): WordSearchIndex {
  let index = wordIndexCache.get(word);
  if (!index) {
    const wordLower = (word.word || '').trim().toLowerCase();
    const wordNorm = normalizeForSearch(word.word || '');
    const wordTokens = wordNorm ? wordNorm.split(' ').filter(Boolean) : [];

    const meaningRaw = (word.trMeaning || '').trim();
    const meaningLower = meaningRaw.toLocaleLowerCase('tr-TR');
    const meaningNorm = normalizeForSearch(meaningRaw);
    const meaningRawTokens = extractRawTokens(meaningRaw);
    const meaningNormTokens = meaningNorm ? meaningNorm.split(' ').filter(Boolean) : [];

    const rawSenses = meaningRaw
      .split(/[,;/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const meaningSensesLower = rawSenses.map((s) => s.toLocaleLowerCase('tr-TR'));
    const meaningSensesNorm = rawSenses.map((s) => normalizeForSearch(s)).filter(Boolean);

    index = {
      id: word.id,
      wordLower,
      wordNorm,
      wordTokens,
      meaningLower,
      meaningNorm,
      meaningRawTokens,
      meaningNormTokens,
      meaningSensesLower,
      meaningSensesNorm,
    };
    wordIndexCache.set(word, index);
  }
  return index;
}

/**
 * Strict prefix / word-start matcher on English headword and short Turkish meaning ONLY.
 * Never performs mid-word substring (.includes()) matching and never searches inside
 * example sentences, collocations, or long academic notes.
 */
export function fastMatchWord(word: WordEntry, rawQuery: string): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const index = getWordSearchIndex(word);
  const queryLower = trimmed.toLowerCase();
  const queryTrLower = trimmed.toLocaleLowerCase('tr-TR');
  const normQuery = normalizeForSearch(trimmed);

  if (!normQuery) return true;

  // Single-word query: must match the START of the English word or the START of a word in Turkish meaning
  if (!normQuery.includes(' ')) {
    if (
      index.wordLower.startsWith(queryLower) ||
      index.wordNorm.startsWith(normQuery)
    ) {
      return true;
    }

    if (
      index.meaningRawTokens.some((token) => token.startsWith(queryTrLower)) ||
      index.meaningNormTokens.some((token) => token.startsWith(normQuery))
    ) {
      return true;
    }

    return false;
  }

  // Multi-word query (e.g. phrasal verb "carry out" or Turkish phrase "ders calismak")
  if (
    index.wordLower.startsWith(queryLower) ||
    index.wordNorm.startsWith(normQuery) ||
    index.meaningSensesLower.some((s) => s.startsWith(queryTrLower)) ||
    index.meaningSensesNorm.some((s) => s.startsWith(normQuery))
  ) {
    return true;
  }

  const queryTokens = normQuery.split(' ').filter(Boolean);
  if (queryTokens.length === 0) return true;

  const matchesAllEnglish = queryTokens.every((qt) =>
    index.wordTokens.some((wt) => wt.startsWith(qt))
  );
  if (matchesAllEnglish) return true;

  const matchesAllTurkish = queryTokens.every((qt) =>
    index.meaningNormTokens.some((mt) => mt.startsWith(qt))
  );
  return matchesAllTurkish;
}
