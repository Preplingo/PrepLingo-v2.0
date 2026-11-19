/**
 * Text to speech helper using browser Web Speech API.
 */
let synth: SpeechSynthesis | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

export function speakText(
  text: string,
  lang: 'en-US' | 'en-GB' | 'tr-TR' = 'en-US',
  rate: number = 1.0,
  onEnd?: () => void
): boolean {
  if (!synth) {
    console.warn('Speech synthesis not supported in this browser.');
    return false;
  }

  try {
    // Cancel any active utterance before playing new
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // 0.8 for slow learning, 1.0 for standard
    utterance.pitch = 1.0;

    // Pick suitable voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.error('Error during TTS:', err);
    return false;
  }
}

export function stopSpeaking() {
  if (synth) {
    synth.cancel();
  }
}
