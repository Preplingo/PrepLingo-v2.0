import * as XLSX from 'xlsx';
import { WordEntry } from '../types';
import {
  offlineDictionary,
  ensureOfflineDictionaryLoaded,
} from '../data/offlineDictionaryLoader';

interface ExportRow {
  word: string;
  meaning: string;
}

type CategoryKey = 'verb' | 'noun' | 'adjective' | 'adverb';

function deduplicateMeaningText(raw: string): string {
  const parts = raw
    .split(/[,;]+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i].toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(parts[i]);
    }
  }
  return unique.join(', ');
}

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

  return Array.from(matched);
}

/**
 * Builds the 4-sheet categorized workbook from BOTH:
 * 1) All Prep Cards & custom words in the app (`words`)
 * 2) The cleaned, inflection-free offline dictionary pool (`sozluk_clean_v2`)
 *
 * Strictly 4 sheets in exact order:
 * 1. Fiiller   (Verbs + Turkish meanings)
 * 2. İsimler   (Nouns + Turkish meanings)
 * 3. Sıfatlar  (Adjectives + Turkish meanings)
 * 4. Zarflar   (Adverbs + Turkish meanings)
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
  };

  // 1. Add all Prep Cards & custom words first (takes priority over general offline entries)
  for (let i = 0; i < words.length; i++) {
    const entry = words[i];
    const word = (entry?.word || '').trim();
    if (!word) continue;
    const meaning = deduplicateMeaningText((entry.trMeaning || entry.meaning || '').trim());
    const key = word.toLowerCase();

    const rawPos = entry.offlinePosLabel || entry.partOfSpeech || entry.type || '';
    const categories = extractCategoriesFromPosString(String(rawPos));

    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      if (!buckets[cat].has(key)) {
        buckets[cat].set(key, {
          word,
          meaning,
        });
      }
    }
  }

  // 2. Merge all cleaned, deduplicated entries from offlineDictionary
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

  // Strictly 4 sheets in exact order: 1. Fiiller, 2. İsimler, 3. Sıfatlar, 4. Zarflar
  appendTwoColSheet('Fiiller', sortRows(buckets.verb));
  appendTwoColSheet('İsimler', sortRows(buckets.noun));
  appendTwoColSheet('Sıfatlar', sortRows(buckets.adjective));
  appendTwoColSheet('Zarflar', sortRows(buckets.adverb));

  return workbook;
}

/**
 * Ensures the cleaned offline dictionary is loaded, merges it with all Prep Cards, categorizes into
 * strictly 4 sheets (Fiiller, İsimler, Sıfatlar, Zarflar) with Turkish meanings, and triggers
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
