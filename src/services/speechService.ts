declare global {
  interface Window {
    electron?: {
      tts: {
        speak: (text: string) => Promise<boolean>;
        cancel: () => void;
        test: () => Promise<boolean>;
      };
    };
  }
}

class SpeechService {
  private queue: string[] = [];
  private speaking = false;
  private enabled = false;
  private lang = 'pt-BR';
  private rate = 1.1;
  private useNativeBridge = false;

  async setEnabled(value: boolean) {
    this.enabled = value;
    if (value) {
      // Ao ativar, testa se o bridge do Electron está funcional
      if (window.electron?.tts) {
        try {
          this.useNativeBridge = await window.electron.tts.test();
          console.log('[SpeechService] Native bridge status:', this.useNativeBridge);
        } catch (e) {
          console.error('[SpeechService] Failed to test native bridge:', e);
          this.useNativeBridge = false;
        }
      } else {
        this.useNativeBridge = false;
      }
    } else {
      this.cancel();
    }
  }

  setLang(lang: string) {
    this.lang = lang.toLowerCase() === 'pt-br' ? 'pt-BR' : 'en-US';
  }

  setRate(rate: number) {
    this.rate = rate;
  }

  speak(text: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.enabled) return;

    if (priority === 'assertive') {
      this.cancel();
    }

    if (this.useNativeBridge && window.electron?.tts) {
      window.electron.tts.speak(text).catch(() => {
        // Fallback dinâmico se a bridge falhar no meio do caminho
        this.fallbackSpeak(text);
      });
    } else {
      this.fallbackSpeak(text);
    }
  }

  private fallbackSpeak(text: string) {
    this.queue.push(text);
    if (!this.speaking) this.processQueue();
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const utterance = new SpeechSynthesisUtterance(this.queue.shift()!);
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
    
    // Cancela ambos os backends para garantir silêncio
    if (window.electron?.tts) {
      window.electron.tts.cancel();
    }
    window.speechSynthesis.cancel();
  }
}

export const speech = new SpeechService();
