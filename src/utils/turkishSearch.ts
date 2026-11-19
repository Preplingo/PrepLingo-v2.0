import { WordEntry } from '../types';

/**
 * Fast LRU-style cache for string normalization to avoid re-running regexes on 1000+ words.
 */
const normCache = new Map<string, string>();
const MAX_CACHE_SIZE = 4000;

/**
 * Utility to normalize Turkish and English strings for fuzzy instant search.
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
 * Checks if search query matches any target text either directly or normalized.
 */
export function matchesQuery(target: string, query: string): boolean {
  if (!query) return true;
  if (!target) return false;

  const cleanTarget = target.toLocaleLowerCase('tr-TR');
  const cleanQuery = query.toLocaleLowerCase('tr-TR');

  if (cleanTarget.includes(cleanQuery)) {
    return true;
  }

  const normTarget = normalizeForSearch(target);
  const normQuery = normalizeForSearch(query);

  return normTarget.includes(normQuery);
}

/**
 * High-performance precomputed index for a WordEntry to enable sub-millisecond search across 1000+ words.
 */
export interface WordSearchIndex {
  id: string;
  wordLower: string;
  wordNorm: string;
  meaningLower: string;
  meaningNorm: string;
  fullBlob: string;
}

const wordIndexCache = new WeakMap<WordEntry, WordSearchIndex>();

export function getWordSearchIndex(word: WordEntry): WordSearchIndex {
  let index = wordIndexCache.get(word);
  if (!index) {
    const wordLower = word.word.toLowerCase();
    const wordNorm = normalizeForSearch(word.word);
    const meaningLower = word.trMeaning.toLowerCase();
    const meaningNorm = normalizeForSearch(word.trMeaning);
    const collocationsStr = (word.collocations || []).join(' ');
    const fullBlob = `${wordNorm} ${meaningNorm} ${normalizeForSearch(word.enExample)} ${normalizeForSearch(word.trExample)} ${normalizeForSearch(collocationsStr)}`;

    index = {
      id: word.id,
      wordLower,
      wordNorm,
      meaningLower,
      meaningNorm,
      fullBlob,
    };
    wordIndexCache.set(word, index);
  }
  return index;
}

/**
 * Tests a word against a search query using its precomputed index.
 * Handles single or multi-word tokens (e.g., "achieve goal").
 */
export function fastMatchWord(word: WordEntry, rawQuery: string): boolean {
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const index = getWordSearchIndex(word);
  const normQuery = normalizeForSearch(trimmed);

  if (!normQuery) return true;

  // Single word fast-path
  if (!normQuery.includes(' ')) {
    return (
      index.wordLower.startsWith(normQuery) ||
      index.wordNorm.startsWith(normQuery) ||
      index.meaningNorm.startsWith(normQuery) ||
      index.wordNorm.includes(normQuery) ||
      index.meaningNorm.includes(normQuery) ||
      index.fullBlob.includes(normQuery)
    );
  }

  // Multi-token query (all tokens must match the full indexed blob)
  const tokens = normQuery.split(' ');
  return tokens.every((token) => index.fullBlob.includes(token));
}
