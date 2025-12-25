
class AudioService {
  private ambientAudio: HTMLAudioElement | null = null;
  private breezeAudio: HTMLAudioElement | null = null;
  private rustleAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    // Multi-layered nature ambience
    this.ambientAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3'); // Forest birds
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0.08;

    this.breezeAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2493/2493-preview.mp3'); // Soft wind
    this.breezeAudio.loop = true;
    this.breezeAudio.volume = 0.04;

    this.rustleAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3'); // Soft leaves
    this.rustleAudio.volume = 0.05;
  }

  toggleAmbient(enabled: boolean) {
    if (!this.ambientAudio || !this.breezeAudio) return;
    if (enabled) {
      this.ambientAudio.play().catch(e => console.log("Audio play blocked", e));
      this.breezeAudio.play().catch(e => console.log("Audio play blocked", e));
      this.isPlaying = true;
    } else {
      this.ambientAudio.pause();
      this.breezeAudio.pause();
      this.isPlaying = false;
    }
  }

  playFeedback(type: 'analyze' | 'success' | 'click' | 'focus' | 'rustle') {
    const sfx = new Audio();
    switch(type) {
      case 'analyze':
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
        break;
      case 'success':
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
        break;
      case 'focus':
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; // Lens snap
        break;
      case 'rustle':
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3';
        break;
      case 'click':
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3';
        break;
      default:
        sfx.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
    }
    sfx.volume = 0.15;
    sfx.play().catch(() => {});
  }

  announce(text: string, langCode: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.92; // Slightly slower for rural accessibility
    utterance.pitch = 1.0; 
    
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural/premium voices if the browser provides them
    const bestVoice = voices.find(v => v.lang.startsWith(langCode) && (v.name.includes('Natural') || v.name.includes('Premium')));
    if (bestVoice) utterance.voice = bestVoice;

    window.speechSynthesis.speak(utterance);
  }
}

export const audioService = new AudioService();
