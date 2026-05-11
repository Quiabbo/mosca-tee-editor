class SpeechService {
  private queue: string[] = [];
  private speaking = false;
  private enabled = false;
  private lang = 'pt-BR';
  private rate = 1.1;

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) window.speechSynthesis.cancel();
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
      window.speechSynthesis.cancel();
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
    const utterance = new SpeechSynthesisUtterance(this.queue.shift()!);
    utterance.lang = this.lang;
    utterance.rate = this.rate;

    // Tentar encontrar uma voz específica para o idioma
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
    window.speechSynthesis.cancel();
    this.speaking = false;
  }
}

export const speech = new SpeechService();
