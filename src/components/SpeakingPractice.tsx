import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { WordEntry } from '../types';
import { speakText } from '../utils/textToSpeech';
import {
  isSpeechRecognitionSupported,
  evaluateSpeechAccuracy,
  PronunciationResult
} from '../utils/speechRecognition';
import { getCefrBadgeClass, getPosBadgeClass, getPosTurkishLabel } from '../utils/themeBadges';
import confetti from 'canvas-confetti';

interface SpeakingPracticeProps {
  words: WordEntry[];
  initialWordId?: string;
}

// Global browser SpeechRecognition type declaration
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ words, initialWordId }) => {
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<PronunciationResult | null>(null);
  const [isListeningAudio, setIsListeningAudio] = useState(false);
  const [isSlowAudio, setIsSlowAudio] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setRecognitionSupported(isSpeechRecognitionSupported());
  }, []);

  // Set initial word if passed
  useEffect(() => {
    if (initialWordId) {
      const idx = words.findIndex((w) => w.id === initialWordId);
      if (idx !== -1) {
        setSelectedWordIndex(idx);
        setEvaluationResult(null);
        setRecordedTranscript('');
      }
    }
  }, [initialWordId, words]);

  const currentWord = words[selectedWordIndex] || words[0];

  const handleNextWord = () => {
    setSelectedWordIndex((prev) => (prev + 1) % words.length);
    setEvaluationResult(null);
    setRecordedTranscript('');
    setMicError(null);
  };

  const handlePrevWord = () => {
    setSelectedWordIndex((prev) => (prev - 1 + words.length) % words.length);
    setEvaluationResult(null);
    setRecordedTranscript('');
    setMicError(null);
  };

  // Speaks English ONLY
  const handleListenSample = (text: string) => {
    setIsListeningAudio(true);
    speakText(text, 'en-US', isSlowAudio ? 0.75 : 1.0, () => {
      setIsListeningAudio(false);
    });
  };

  const startRecording = () => {
    setMicError(null);
    setEvaluationResult(null);
    setRecordedTranscript('');

    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setMicError('Tarayıcınızda konuşma tanıma özelliği desteklenmiyor. Lütfen Chrome, Edge veya Safari güncel sürümü kullanın.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecordedTranscript(transcript);
        const evalResult = evaluateSpeechAccuracy(currentWord.enExample, transcript);
        setEvaluationResult(evalResult);
        setIsRecording(false);

        if (evalResult.accuracy >= 85) {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
          });
        }
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        console.warn('Konuşma tanıma hatası:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından mikrofon erişimine izin verin.');
        } else if (event.error === 'no-speech') {
          setMicError('Ses algılanamadı. Lütfen mikrofona daha yakın konuşarak tekrar deneyin.');
        } else {
          setMicError(`Ses algılama hatası (${event.error}). Lütfen tekrar deneyin.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsRecording(false);
      setMicError('Mikrofon başlatılamadı. Lütfen mikrofon bağlantınızı kontrol edip tekrar deneyin.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Practice Card */}
      <div className="bg-[#ffffff] dark:bg-[#1e293b] rounded-3xl p-5 sm:p-7 border border-[#e2e8f0] dark:border-[#334155] shadow-sm space-y-5">
        {/* Top Header: Word + Level + Index */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] dark:border-[#334155] pb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase px-2.5 py-1 rounded-lg tracking-wide ${getCefrBadgeClass(currentWord.cefrLevel)}`}>
              {currentWord.cefrLevel}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-lg ${getPosBadgeClass(currentWord.partOfSpeech)}`}>
              {getPosTurkishLabel(currentWord.partOfSpeech)}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevWord}
              className="p-1.5 rounded-xl text-[#475569] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
              title="Önceki cümle"
            >
              <ChevronLeft width={20} height={20} fill="none" stroke="#475569" className="w-5 h-5 dark:stroke-[#94a3b8]" />
            </button>
            <span className="text-xs font-mono text-[#475569] dark:text-[#94a3b8]">
              {selectedWordIndex + 1} / {words.length}
            </span>
            <button
              type="button"
              onClick={handleNextWord}
              className="p-1.5 rounded-xl text-[#475569] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a] transition-colors cursor-pointer"
              title="Sonraki cümle"
            >
              <ChevronRight width={20} height={20} fill="none" stroke="#475569" className="w-5 h-5 dark:stroke-[#94a3b8]" />
            </button>
          </div>
        </div>

        {/* Word Info & English Audio */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-['Outfit'] text-[#0f172a] dark:text-[#f8fafc]">
              {currentWord.word}
            </h2>
          </div>
          {/* ENGLISH audio button */}
          <button
            type="button"
            onClick={() => handleListenSample(currentWord.word)}
            className="p-2 rounded-xl bg-[#ecfdf5] dark:bg-[#064e3b] text-[#16a34a] dark:text-[#34d399] hover:bg-[#d1fae5] transition-colors cursor-pointer"
            title="İngilizce kelimeyi dinle"
          >
            <Volume2 width={20} height={20} fill="none" stroke="#16a34a" className="w-5 h-5 dark:stroke-[#34d399]" />
          </button>
        </div>

        {/* Target Sentence Box */}
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] dark:border-[#334155] space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#16a34a] dark:text-[#34d399] block">
              Seslendirilecek İngilizce Cümle:
            </span>
            <p className="text-base sm:text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc] leading-relaxed">
              &quot;{currentWord.enExample}&quot;
            </p>
            {/* Turkish translation: NO AUDIO BUTTON */}
            <p className="text-xs text-[#475569] dark:text-[#94a3b8] italic">
              &quot;{currentWord.trExample}&quot;
            </p>
          </div>

          {/* Audio Pacing Controls (ENGLISH ONLY) */}
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#e2e8f0] dark:border-[#334155]">
            <button
              type="button"
              onClick={() => handleListenSample(currentWord.enExample)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#ffffff] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#0f172a] dark:text-[#f8fafc] hover:border-[#10b981] flex items-center gap-1.5 transition-colors cursor-pointer ${
                isListeningAudio ? 'animate-pulse text-[#16a34a]' : ''
              }`}
            >
              <Volume2 width={14} height={14} fill="none" stroke={isListeningAudio ? '#16a34a' : '#475569'} className="w-3.5 h-3.5" />
              <span>Önce Doğru Telaffuzu Dinle</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSlowAudio(!isSlowAudio)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono border transition-colors cursor-pointer ${
                isSlowAudio
                  ? 'bg-[#ecfdf5] dark:bg-[#064e3b] text-[#047857] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#059669]'
                  : 'bg-[#ffffff] dark:bg-[#1e293b] text-[#475569] dark:text-[#94a3b8] border-[#e2e8f0] dark:border-[#334155]'
              }`}
              title="Yavaş oynatmayı aç/kapat"
            >
              {isSlowAudio ? 'Yavaş (0.75x)' : 'Normal (1.0x)'}
            </button>
          </div>
        </div>

        {/* Error message if microphone issue */}
        {micError && (
          <div className="p-3 bg-[#fff1f2] dark:bg-[#4c0519] rounded-xl border border-[#fecdd3] dark:border-[#881337] text-xs text-[#be123c] dark:text-[#fda4af] flex items-start gap-2">
            <AlertCircle width={16} height={16} fill="none" stroke="#be123c" className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{micError}</p>
            </div>
          </div>
        )}

        {/* Speaking Trigger Area */}
        <div className="pt-2 text-center space-y-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            style={{ backgroundColor: isRecording ? '#e11d48' : '#16a34a', color: '#ffffff' }}
            className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
              isRecording
                ? 'bg-[#e11d48] text-[#ffffff] animate-pulse'
                : 'legacy-btn-green bg-[#16a34a] hover:bg-[#15803d] text-[#ffffff] hover:scale-105 active:scale-95'
            }`}
            aria-label={isRecording ? 'Kaydı Durdur' : 'Kaydı Başlat'}
          >
            {isRecording ? (
              <MicOff width={32} height={32} fill="none" stroke="#ffffff" className="w-8 h-8" />
            ) : (
              <Mic width={32} height={32} fill="none" stroke="#ffffff" className="w-8 h-8" />
            )}
          </button>

          <div>
            <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f8fafc] block">
              {isRecording ? 'Dinleniyor... Cümleyi şimdi seslendirin!' : 'Mikrofona Dokun ve Telaffuzunu Test Et'}
            </span>
            <p className="text-xs text-[#475569] dark:text-[#94a3b8]">
              {isRecording ? 'Konuşmayı bitirince tekrar dokunun' : 'İngilizce cümleyi sesli olarak okuyun'}
            </p>
          </div>
        </div>

        {/* Evaluation Feedback Panel */}
        {evaluationResult && (
          <div className="mt-4 p-5 rounded-2xl bg-[#eef2ff] dark:bg-[#1e1b4b] border border-[#c7d2fe] dark:border-[#3730a3] space-y-4 animate-in fade-in duration-200">
            {/* Accuracy Score Banner */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4338ca] dark:text-[#a5b4fc] block">
                  Telaffuz Doğruluk Skoru
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      evaluationResult.accuracy >= 80
                        ? 'text-[#16a34a] dark:text-[#34d399]'
                        : evaluationResult.accuracy >= 60
                        ? 'text-[#d97706] dark:text-[#fbbf24]'
                        : 'text-[#e11d48] dark:text-[#fb7185]'
                    }`}
                  >
                    %{evaluationResult.accuracy}
                  </span>
                  <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                    {evaluationResult.accuracy >= 85 ? 'Mükemmel Telaffuz!' : evaluationResult.accuracy >= 60 ? 'Başarılı' : 'Geliştirilmeli'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleNextWord}
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  className="legacy-btn-indigo px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-[#ffffff] text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Sonraki Cümle</span>
                  <ChevronRight width={16} height={16} fill="none" stroke="#ffffff" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Word-by-Word Breakdown Tokens */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#334155] dark:text-[#cbd5e1] block">
                Kelime Bazında Artikülasyon:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {evaluationResult.wordsAnalysis.map((item, idx) => {
                  let badgeClass = '';
                  if (item.status === 'matched') {
                    badgeClass = 'bg-[#d1fae5] text-[#065f46] dark:bg-[#022c22] dark:text-[#6ee7b7] border-[#6ee7b7] dark:border-[#065f46]';
                  } else if (item.status === 'near') {
                    badgeClass = 'bg-[#fef3c7] text-[#92400e] dark:bg-[#451a03] dark:text-[#fcd34d] border-[#fcd34d] dark:border-[#92400e]';
                  } else {
                    badgeClass = 'bg-[#ffe4e6] text-[#9f1239] dark:bg-[#4c0519] dark:text-[#fda4af] border-[#fda4af] dark:border-[#881337]';
                  }

                  return (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${badgeClass}`}
                    >
                      <span>{item.word}</span>
                      {item.status === 'matched' ? (
                        <CheckCircle2 width={12} height={12} fill="none" stroke="#16a34a" className="w-3 h-3" />
                      ) : null}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Academic Feedback Tip */}
            <div className="p-3.5 bg-[#ffffff] dark:bg-[#0f172a] rounded-xl border border-[#e0e7ff] dark:border-[#334155] text-xs text-[#334155] dark:text-[#cbd5e1] flex items-start gap-2.5">
              <Sparkles width={16} height={16} fill="none" stroke="#4f46e5" className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5 text-[#0f172a] dark:text-[#ffffff]">Telaffuz Testi Değerlendirmesi:</strong>
                <span className="leading-relaxed">{evaluationResult.feedback}</span>
              </div>
            </div>

            {/* Recognized Speech Transcript */}
            <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8] pt-1">
              <span>Algılanan Konuşma: </span>
              <span className="italic font-mono text-[#334155] dark:text-[#cbd5e1]">
                &quot;{evaluationResult.transcript}&quot;
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
