
import React, { useState, useCallback } from 'react';
import { Language } from '../types';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  lang: Language;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscription, lang }) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Comprehensive language mapping
    const langMap: Record<string, string> = {
      [Language.ENGLISH]: 'en-US',
      [Language.HINDI]: 'hi-IN',
      [Language.TELUGU]: 'te-IN',
      [Language.MALAYALAM]: 'ml-IN',
      [Language.TAMIL]: 'ta-IN',
      [Language.KANNADA]: 'kn-IN',
      [Language.MARATHI]: 'mr-IN'
    };
    
    recognition.lang = langMap[lang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscription(transcript);
    };

    recognition.start();
  }, [lang, onTranscription]);

  return (
    <button
      onClick={startListening}
      className={`p-4 rounded-full transition-all shadow-lg ${
        isListening ? 'bg-red-500 animate-pulse text-white scale-110' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      }`}
      title="Speak your problem"
    >
      <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone-lines'} text-xl`}></i>
    </button>
  );
};

export default VoiceInput;
