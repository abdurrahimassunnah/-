export type Page = string;

export type SupportedLanguage = 'en-US' | 'bn-IN' | 'ar-SA' | 'hi-IN' | 'ur-PK' | 'fa-IR';

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
}

export type VoiceCommand = 
  | { type: 'start'; topic: string }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'reset' };

export interface UploadedFile {
    name: string;
    content: string; // Text content or base64 data
    mimeType: string; // IANA MIME type
}

export type WritingMode = 'topic' | 'biography' | 'journal';

// Add Speech Recognition API types
export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

export interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}