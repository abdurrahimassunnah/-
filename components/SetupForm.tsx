
import React, { useState, useEffect, useRef } from 'react';
import FileUpload from './FileUpload';
import LoadingSpinner from './LoadingSpinner';
import type { SupportedLanguage, LanguageOption, UploadedFile, WritingMode, SpeechRecognition } from '../types';

interface SetupFormProps {
    onGenerate: (params: {
        mode: WritingMode;
        topic: string;
        biographySubject: string;
        pageCount?: number;
        files: UploadedFile[];
        journalSample?: string;
    }) => void;
    isLoading: boolean;
    lang: SupportedLanguage;
    onLangChange: (lang: SupportedLanguage) => void;
    t: (key: string) => string;
}

const languageOptions: LanguageOption[] = [
    { value: 'en-US', label: 'English' },
    { value: 'bn-IN', label: 'বাংলা' },
    { value: 'ar-SA', label: 'العربية' },
    { value: 'hi-IN', label: 'हिन्दी' },
    { value: 'ur-PK', label: 'اردو' },
    { value: 'fa-IR', label: 'فارسی' },
];

const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.75 6.75 0 1 1-13.5 0v-1.5A.75.75 0 0 1 6 10.5Z" />
    </svg>
);

const SetupForm: React.FC<SetupFormProps> = ({ onGenerate, isLoading, lang, onLangChange, t }) => {
    const [topic, setTopic] = useState('');
    const [biographySubject, setBiographySubject] = useState('');
    const [pageCount, setPageCount] = useState('20');
    const [mode, setMode] = useState<WritingMode>('journal');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [journalSample, setJournalSample] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isMicSupported, setIsMicSupported] = useState(true);
    const [micError, setMicError] = useState<boolean>(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setIsMicSupported(false);
            console.warn('Speech Recognition API is not supported in this browser.');
        }
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    useEffect(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
    }, [mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isTopicReady = mode === 'topic' && topic.trim();
        const isBiographyReady = mode === 'biography' && biographySubject.trim();
        const isJournalReady = mode === 'journal' && topic.trim();

        if (!isLoading && (isTopicReady || isBiographyReady || isJournalReady)) {
            onGenerate({ 
                topic: topic.trim(), 
                biographySubject: biographySubject.trim(),
                pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
                files,
                mode,
                journalSample: mode === 'journal' ? journalSample : undefined
            });
        }
    };
    
    const activeInput = mode === 'biography' ? biographySubject : topic;
    const setActiveInput = mode === 'biography' ? setBiographySubject : setTopic;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setActiveInput(e.target.value);
        if (micError) {
            setMicError(false);
        }
    };

    const handleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }
        
        setMicError(false);

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                setMicError(true);
            }
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setActiveInput(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
        };

        recognition.start();
    };
    
    const isSubmitDisabled = isLoading || (mode === 'topic' && !topic.trim()) || (mode === 'biography' && !biographySubject.trim()) || (mode === 'journal' && !topic.trim());

    return (
        <div className="w-full max-w-2xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 font-book">{t('main_title')}</h1>
            <p className="text-slate-600 mb-6 font-book">{t('main_subtitle')}</p>

            <div className="relative w-48 mx-auto mb-6">
                <select
                    value={lang}
                    onChange={(e) => onLangChange(e.target.value as SupportedLanguage)}
                    className="w-full bg-white rounded-lg py-2 pl-4 pr-10 shadow-sm border border-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer font-book"
                    disabled={isLoading}
                >
                    {languageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg w-full">
                 <div className="mb-4">
                    <div className="flex justify-center gap-2 bg-slate-200/70 p-1 rounded-lg">
                        {(['journal', 'topic', 'biography'] as WritingMode[]).map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                disabled={isLoading}
                                className={`w-full py-2 text-sm font-bold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 font-book ${mode === m ? 'bg-white text-slate-800 shadow' : 'bg-transparent text-slate-600 hover:bg-white/50'}`}
                            >
                                {t(`mode_${m}`)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 text-left">
                     <div>
                        <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">
                            {mode === 'biography' ? t('label_biography_subject') : t('label_topic')}
                        </label>
                        <div className="relative">
                            <input
                                id="topic-input"
                                type="text"
                                value={activeInput}
                                onChange={handleInputChange}
                                placeholder={mode === 'biography' ? t('placeholder_biography_subject') : (mode === 'journal' ? t('placeholder_journal_topic') : t('placeholder_topic'))}
                                className="w-full px-4 py-2 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400 font-book pr-12"
                                disabled={isLoading}
                            />
                             {isMicSupported && (
                                <button
                                    type="button"
                                    onClick={handleListen}
                                    disabled={isLoading}
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${isListening ? 'text-red-500' : ''}`}
                                    aria-label={isListening ? t('voice_dictate_topic_stop') : t('voice_dictate_topic_start')}
                                >
                                    <MicIcon className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                                </button>
                            )}
                        </div>
                         {micError && <p className="text-red-500 text-xs mt-1 font-book">{t('error_mic_not_allowed')}</p>}
                    </div>

                    {mode === 'journal' && (
                        <div>
                            <label htmlFor="journal-sample" className="block text-sm font-medium text-slate-700 mb-1">
                                {t('label_journal_sample')}
                            </label>
                            <textarea
                                id="journal-sample"
                                value={journalSample}
                                onChange={(e) => setJournalSample(e.target.value)}
                                placeholder={t('placeholder_journal_sample')}
                                className="w-full px-4 py-2 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400 font-book resize-y min-h-[100px]"
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {mode !== 'journal' && (
                        <div>
                            <label htmlFor="page-count-input" className="block text-sm font-medium text-slate-700 mb-1">{t('label_page_count')}</label>
                            <input
                                id="page-count-input"
                                type="number"
                                min="1"
                                value={pageCount}
                                onChange={(e) => setPageCount(e.target.value)}
                                placeholder={t('placeholder_page_count')}
                                className="w-full px-4 py-2 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder:text-slate-400 font-book"
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {mode === 'journal' ? t('label_file_upload_journal') : t('label_file_upload')}
                        </label>
                        <FileUpload files={files} onFilesChange={setFiles} disabled={isLoading} t={t} />
                        <p className="text-xs text-slate-500 mt-1">
                             {mode === 'journal' ? t('file_upload_subtext_journal') : t('file_upload_subtext')}
                        </p>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex w-full mt-6 items-center justify-center bg-slate-700 text-white font-bold px-6 py-3 text-lg hover:bg-slate-800 focus:outline-none disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-book rounded-lg"
                >
                    {isLoading ? <LoadingSpinner /> : (mode === 'journal' ? t('btn_start_writing') : t('btn_start_writing_book'))}
                </button>
            </form>
        </div>
    );
};

export default SetupForm;
