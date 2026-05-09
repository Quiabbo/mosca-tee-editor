// Detect Electron-exposed TTS bridge (set up in preload.cjs).
// In the Flatpak/Electron build the renderer's window.speechSynthesis
// often has no voices because libspeechd is not loaded inside Chromium,
// so we route through the Node main process which talks to the host
// speech-dispatcher socket directly.
const electronTts: { speak: (text: string, lang: string, rate: number) => Promise<boolean>; cancel: () => void } | undefined =
  (typeof window !== 'undefined' && (window as any).electron && (window as any).electron.tts) || undefined;

class SpeechService {
  private queue: string[] = [];
  private speaking = false;
  private enabled = false;
  private lang = 'pt-BR';
  private rate = 1.1;

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) this.cancel();
  }

  setLang(lang: string) {
    // Mapear: 'pt-br' → 'pt-BR', 'en' → 'en-US'
    this.lang = lang.toLowerCase() === 'pt-br' ? 'pt-BR' : 'en-US';
  }

  setRate(rate: number) {
    this.rate = rate;
  }

  speak(text: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.enabled) return;
    if (priority === 'assertive') {
      this.cancel();
      this.queue = [];
    }
    this.queue.push(text);
    if (!this.speaking) this.processQueue();
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const text = this.queue.shift()!;

    // Prefer Electron IPC bridge (works in Flatpak)
    if (electronTts) {
      electronTts.speak(text, this.lang, this.rate).finally(() => {
        // We can't easily detect "done" via SSIP without more work, so
        // estimate: ~70ms per character at rate 1, scaled by rate.
        const estMs = Math.max(400, Math.round((text.length * 70) / Math.max(0.3, this.rate)));
        setTimeout(() => this.processQueue(), estMs);
      });
      return;
    }

    // Web Speech API fallback (browser / dev)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.lang;
    utterance.rate = this.rate;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.toLowerCase() === this.lang.toLowerCase()) ||
                          voices.find(v => v.lang.toLowerCase().startsWith(this.lang.toLowerCase().split('-')[0]));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => this.processQueue();
    utterance.onerror = () => {
      this.speaking = false;
      this.processQueue();
    };
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    this.queue = [];
    this.speaking = false;
    if (electronTts) {
      electronTts.cancel();
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speech = new SpeechService();
