/**
 * Speech Recognition and pronunciation analysis helper
 */

export interface WordAnalysis {
  word: string;
  status: 'matched' | 'near' | 'missed';
  recognizedAs?: string;
}

export interface PronunciationResult {
  accuracy: number; // 0 - 100
  feedback: string;
  transcript: string;
  wordsAnalysis: WordAnalysis[];
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

// Simple Levenshtein distance
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 0; i <= bn; ++i) matrix[i][0] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

function cleanToken(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
}

export function evaluateSpeechAccuracy(
  targetSentence: string,
  spokenTranscript: string
): PronunciationResult {
  const targetWords = targetSentence.split(/\s+/).map(cleanToken).filter(Boolean);
  const spokenWords = spokenTranscript.split(/\s+/).map(cleanToken).filter(Boolean);

  if (targetWords.length === 0) {
    return {
      accuracy: 0,
      feedback: 'No target words to analyze.',
      transcript: spokenTranscript,
      wordsAnalysis: []
    };
  }

  const analysis: WordAnalysis[] = [];
  let matchedCount = 0;
  let nearCount = 0;

  // Track matched spoken word indices so we don't double count
  const usedSpoken = new Set<number>();

  targetWords.forEach((tw) => {
    let bestDist = 999;
    let bestIdx = -1;

    for (let i = 0; i < spokenWords.length; i++) {
      if (usedSpoken.has(i)) continue;
      const sw = spokenWords[i];
      const dist = levenshtein(tw, sw);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1 && bestDist === 0) {
      usedSpoken.add(bestIdx);
      matchedCount++;
      analysis.push({
        word: tw,
        status: 'matched',
        recognizedAs: spokenWords[bestIdx]
      });
    } else if (bestIdx !== -1 && bestDist <= Math.max(1, Math.floor(tw.length * 0.35))) {
      usedSpoken.add(bestIdx);
      nearCount++;
      analysis.push({
        word: tw,
        status: 'near',
        recognizedAs: spokenWords[bestIdx]
      });
    } else {
      analysis.push({
        word: tw,
        status: 'missed'
      });
    }
  });

  const accuracy = Math.round(
    Math.min(100, Math.max(0, ((matchedCount * 1.0 + nearCount * 0.65) / targetWords.length) * 100))
  );

  let feedback = '';
  if (accuracy >= 90) {
    feedback = 'Mükemmel Telaffuz! 🎉 Akıcı ve doğal bir söyleyiş. Bu kelimeyi tam puanla geçtiniz.';
  } else if (accuracy >= 75) {
    feedback = 'Çok İyi! 👏 Vurgu ve sesler oldukça net, küçük nüanslar dışında anlaşılırlık harika.';
  } else if (accuracy >= 50) {
    feedback = 'Geliştirilebilir 👍 Bazı heceler ve sesler eksik veya farklı algılandı. Önce dinleyip tekrar deneyin.';
  } else {
    feedback = 'Tekrar Deneyin 🎧 Doğru telaffuzu dinlemek için hoparlör simgesine dokunun ve ritme dikkat ederek yeniden söyleyin.';
  }

  return {
    accuracy,
    feedback,
    transcript: spokenTranscript,
    wordsAnalysis: analysis
  };
}
