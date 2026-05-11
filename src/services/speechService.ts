// Detect Electron-exposed TTS bridge (set up in preload.cjs).
// In the Flatpak/Electron build the renderer's window.speechSynthesis
// often has no voices because libspeechd is not loaded inside Chromium,
// so we route through the Node main process which talks to the host
// speech-dispatcher socket directly.
// If the native bridge fails, we fall back to the Web Speech API.
const electronTts: {
  speak: (text: string, lang: string, rate: number) => Promise<boolean>;
  cancel: () => void;
  test: () => Promise<{ available: boolean; backend: string }>;
} | undefined =
  (typeof window !== 'undefined' && (window as any).electron && (window as any).electron.tts) || undefined;

class SpeechService {
  private queue: string[] = [];
  private speaking = false;
  private enabled = false;
  private lang = 'pt-BR';
  private rate = 1.1;
  // Whether we already tested the Electron TTS bridge
  private electronTtsTested = false;
  // Whether the Electron TTS bridge actually works (native backend found)
  private electronTtsWorks = false;

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) this.cancel();
    // Reset test state when toggling so we re-test on next speak
    if (value) {
      this.electronTtsTested = false;
      this.electronTtsWorks = false;
      this.testElectronTts();
    }
  }

  setLang(lang: string) {
    // Mapear: 'pt-br' → 'pt-BR', 'en' → 'en-US'
    this.lang = lang.toLowerCase() === 'pt-br' ? 'pt-BR' : 'en-US';
  }

  setRate(rate: number) {
    this.rate = rate;
  }

  /**
   * Test if the Electron TTS bridge has a working native backend.
   * Called once when accessibility is enabled.
   */
  private async testElectronTts() {
    if (!electronTts || this.electronTtsTested) return;
    this.electronTtsTested = true;
    try {
      const result = await electronTts.test();
      this.electronTtsWorks = result.available;
      console.log(`[SpeechService] Electron TTS test: available=${result.available}, backend=${result.backend}`);
    } catch (err) {
      console.warn('[SpeechService] Electron TTS test failed:', err);
      this.electronTtsWorks = false;
    }
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

    // Prefer Electron IPC bridge if it tested OK (works in Flatpak)
    if (electronTts && this.electronTtsWorks) {
      electronTts.speak(text, this.lang, this.rate).then((success) => {
        if (!success) {
          // Native TTS failed at runtime — try Web Speech API for this text
          console.warn('[SpeechService] Electron TTS returned false, falling back to Web Speech API');
          this.speakViaWebAPI(text);
          return;
        }
        // Estimate duration: ~70ms per character at rate 1, scaled by rate.
        const estMs = Math.max(400, Math.round((text.length * 70) / Math.max(0.3, this.rate)));
        setTimeout(() => this.processQueue(), estMs);
      }).catch(() => {
        // IPC error — fallback
        console.warn('[SpeechService] Electron TTS IPC error, falling back to Web Speech API');
        this.speakViaWebAPI(text);
      });
      return;
    }

    // Web Speech API (browser / dev / fallback)
    this.speakViaWebAPI(text);
  }

  private speakViaWebAPI(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[SpeechService] No Web Speech API available');
      this.speaking = false;
      this.processQueue();
      return;
    }

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
    utterance.onerror = (e) => {
      console.warn('[SpeechService] Web Speech API error:', e.error);
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
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speech = new SpeechService();
