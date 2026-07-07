import React, { useState, useEffect, useRef } from 'react';
import type { SupportedLanguage, VoiceCommand, SpeechRecognition } from '../types';
// FIX: Correctly import useTranslations from the translations library.
import { useTranslations } from '../lib/translations';

interface VoiceControlProps {
  onCommand: (command: VoiceCommand) => void;
  disabled: boolean;
  selectedLang: SupportedLanguage;
}

const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.75 6.75 0 1 1-13.5 0v-1.5A.75.75 0 0 1 6 10.5Z" />
    </svg>
);

const VoiceControl: React.FC<VoiceControlProps> = ({ onCommand, disabled, selectedLang }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const t = useTranslations(selectedLang);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      console.warn('Speech Recognition API is not supported in this browser.');
    }
  }, []);

  const processCommand = (transcript: string) => {
    const text = transcript.toLowerCase().trim();
    console.log(`Transcript (${selectedLang}): "${text}"`);

    const commandMap = {
      next: t('voice_command_next').split(',').map(cmd => cmd.toLowerCase().trim()),
      prev: t('voice_command_prev').split(',').map(cmd => cmd.toLowerCase().trim()),
      reset: t('voice_command_reset').split(',').map(cmd => cmd.toLowerCase().trim()),
    };

    if (commandMap.next.some(cmd => text.includes(cmd))) {
        onCommand({ type: 'next' });
        return;
    }
    if (commandMap.prev.some(cmd => text.includes(cmd))) {
        onCommand({ type: 'prev' });
        return;
    }
    if (commandMap.reset.some(cmd => text.includes(cmd))) {
      onCommand({ type: 'reset' });
      return;
    }
  };


  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onerror = (event) => { 
        console.error('Speech recognition error', event.error); 
        if (event.error === 'not-allowed') {
            alert(t('error_mic_not_allowed'));
        }
        setIsListening(false); 
    };
    recognition.onresult = (event) => { processCommand(event.results[0][0].transcript); };

    recognition.start();
  };
  
  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={handleListen}
        disabled={disabled}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed
          ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}
        `}
        aria-label={isListening ? t('voice_listening_stop') : t('voice_listening_start')}
      >
        <MicIcon className={`w-7 h-7 text-white transition-transform ${isListening ? 'animate-pulse' : ''}`}/>
      </button>
    </div>
  );
};

export default VoiceControl;