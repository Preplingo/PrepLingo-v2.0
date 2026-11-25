import * as XLSX from 'xlsx';
import { WordEntry } from '../types';
import {
  offlineDictionary,
  ensureOfflineDictionaryLoaded,
} from '../data/offlineDictionaryLoader';

interface ExportRow {
  word: string;
  meaning: string;
  posLabel?: string;
}

type CategoryKey = 'verb' | 'noun' | 'adjective' | 'adverb' | 'other';

function extractCategoriesFromPosString(rawPos: string): CategoryKey[] {
  const tokens = rawPos
    .toLocaleLowerCase('tr-TR')
    .split(/[,;/]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const matched = new Set<CategoryKey>();

  for (const token of tokens) {
    if (token === 'fiil' || token === 'verb' || token === 'v') {
      matched.add('verb');
    } else if (token === 'isim' || token === 'ad' || token === 'noun' || token === 'n') {
      matched.add('noun');
    } else if (
      token === 'sıfat' ||
      token === 'sifat' ||
      token === 'adjective' ||
      token === 'adj'
    ) {
      matched.add('adjective');
    } else if (
      token === 'zarf' ||
      token === 'belirteç' ||
      token === 'adverb' ||
      token === 'adv'
    ) {
      matched.add('adverb');
    }
  }

  if (matched.size === 0) {
    matched.add('other');
  }

  return Array.from(matched);
}

function getTurkishPosFallback(rawPos?: string): string {
  const lower = (rawPos || '').trim().toLocaleLowerCase('tr-TR');
  if (lower === 'conjunction' || lower === 'conj') return 'Bağlaç';
  if (lower === 'preposition' || lower === 'prep') return 'Edat';
  return (rawPos || '').trim() || 'Genel';
}

/**
 * Builds the categorized workbook from BOTH:
 * 1) All Prep Cards & custom words in the app (`words`)
 * 2) The full external offline dictionary (`public/sozluk.json`)
 *
 * Sheet order:
 * 1. Fiiller   (Verbs + Turkish meanings)
 * 2. İsimler   (Nouns + Turkish meanings)
 * 3. Sıfatlar  (Adjectives + Turkish meanings)
 * 4. Zarflar   (Adverbs + Turkish meanings)
 * 5. Diğer     (Remaining Edat/Bağlaç/Zamir/Ünlem entries, if any, so 100% of words are included)
 */
export function buildCategorizedExcelWorkbook(
  words: WordEntry[],
  offlineEntries: ReadonlyArray<{ w: string; wLower: string; pLabel: string; t: string }>
): XLSX.WorkBook {
  const buckets: Record<CategoryKey, Map<string, ExportRow>> = {
    verb: new Map<string, ExportRow>(),
    noun: new Map<string, ExportRow>(),
    adjective: new Map<string, ExportRow>(),
    adverb: new Map<string, ExportRow>(),
    other: new Map<string, ExportRow>(),
  };

  // 1. Add all Prep Cards & custom words first (takes priority over general offline entries)
  for (let i = 0; i < words.length; i++) {
    const entry = words[i];
    const word = (entry?.word || '').trim();
    if (!word) continue;
    const meaning = (entry.trMeaning || entry.meaning || '').trim();
    const key = word.toLowerCase();

    const rawPos = entry.offlinePosLabel || entry.partOfSpeech || entry.type || '';
    const categories = extractCategoriesFromPosString(String(rawPos));

    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      if (!buckets[cat].has(key)) {
        buckets[cat].set(key, {
          word,
          meaning,
          posLabel: cat === 'other' ? getTurkishPosFallback(String(rawPos)) : undefined,
        });
      }
    }
  }

  // 2. Merge all entries from external public/sozluk.json
  for (let i = 0; i < offlineEntries.length; i++) {
    const item = offlineEntries[i];
    const word = (item.w || '').trim();
    if (!word) continue;
    const meaning = (item.t || '').trim();
    const key = item.wLower || word.toLowerCase();
    const categories = extractCategoriesFromPosString(item.pLabel || '');

    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      if (!buckets[cat].has(key)) {
        buckets[cat].set(key, {
          word,
          meaning,
          posLabel: cat === 'other' ? getTurkishPosFallback(item.pLabel) : undefined,
        });
      }
    }
  }

  const collator = new Intl.Collator('en', { sensitivity: 'base' });
  const sortRows = (map: Map<string, ExportRow>): ExportRow[] =>
    Array.from(map.values()).sort((a, b) => collator.compare(a.word, b.word));

  const workbook = XLSX.utils.book_new();

  const appendTwoColSheet = (sheetName: string, rows: ExportRow[]) => {
    const aoa: string[][] = new Array(rows.length + 1);
    aoa[0] = ['İngilizce Kelime', 'Türkçe Anlamı'];
    for (let i = 0; i < rows.length; i++) {
      aoa[i + 1] = [rows[i].word, rows[i].meaning];
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 26 }, { wch: 64 }];
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  };

  // Exact required sheet order: 1. Fiiller, 2. İsimler, 3. Sıfatlar, 4. Zarflar
  appendTwoColSheet('Fiiller', sortRows(buckets.verb));
  appendTwoColSheet('İsimler', sortRows(buckets.noun));
  appendTwoColSheet('Sıfatlar', sortRows(buckets.adjective));
  appendTwoColSheet('Zarflar', sortRows(buckets.adverb));

  // Include any remaining words (Edat, Bağlaç, Zamir, Ünlem, Genel) on sheet 5 so zero words are omitted
  const otherRows = sortRows(buckets.other);
  if (otherRows.length > 0) {
    const aoa: string[][] = new Array(otherRows.length + 1);
    aoa[0] = ['İngilizce Kelime', 'Tür', 'Türkçe Anlamı'];
    for (let i = 0; i < otherRows.length; i++) {
      aoa[i + 1] = [otherRows[i].word, otherRows[i].posLabel || 'Genel', otherRows[i].meaning];
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 58 }];
    XLSX.utils.book_append_sheet(workbook, ws, 'Diğer');
  }

  return workbook;
}

/**
 * Ensures public/sozluk.json is loaded, merges it with all Prep Cards, categorizes into
 * Fiiller / İsimler / Sıfatlar / Zarflar (+ Diğer) with Turkish meanings, and triggers
 * native Excel (.xlsx) download on both mobile and desktop.
 */
export async function exportAllWordsToExcel(words: WordEntry[]): Promise<void> {
  await ensureOfflineDictionaryLoaded();

  // Yield one frame so any loading spinner on the Header button renders before workbook serialization
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 40);
  });

  const offlineEntries = offlineDictionary.getEntriesForExport();
  const workbook = buildCategorizedExcelWorkbook(words, offlineEntries);

  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
  });

  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'PrepLingo_Tum_Kelimeler.xlsx';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 3000);
}
