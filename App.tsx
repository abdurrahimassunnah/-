
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateInitialContent, generateNextPages } from './services/geminiService';
import StoryBook from './components/StoryBook';
import VoiceControl from './components/VoiceControl';
import SetupForm from './components/SetupForm';
import ShareModal from './components/ShareModal';
import GenerationProgressButton from './components/GenerationProgressButton';
// FIX: Correctly import useTranslations from the translations library.
import { useTranslations } from './lib/translations';
import type { Page, VoiceCommand, SupportedLanguage, UploadedFile, WritingMode } from './types';

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .826 5.68l-4.505 2.502a3.001 3.001 0 0 1 0 2.636l4.505 2.502a3 3 0 1 1-.826 1.18l-4.505-2.502a3 3 0 1 1 0-4.996l4.505-2.502a3 3 0 0 1 0-1.18Z" clipRule="evenodd" />
  </svg>
);

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('bn-IN');
  const [notification, setNotification] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [writingMode, setWritingMode] = useState<WritingMode | null>(null);

  const t = useTranslations(selectedLang);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  
  const handleGenerate = async (params: {
    mode: WritingMode,
    topic: string;
    biographySubject: string;
    pageCount?: number;
    files: UploadedFile[];
    journalSample?: string;
  }) => {
    if (!params.topic && !params.biographySubject) return;
    setIsLoading(true);
    setError(null);
    setWritingMode(params.mode);
    try {
      const { content, title } = await generateInitialContent({
        ...params,
        language: selectedLang,
      });
      setPages(content);
      setTitle(title);
      setIsGenerated(true);
      setCurrentPage(0);
    } catch (e: any) {
      setError(e?.message || t('error_start_generation'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (isGeneratingMore) return;
    setIsGeneratingMore(true);
    setGenerationProgress(0);
    
    // Animate progress bar
    const interval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 1, 99));
    }, 150);

    try {
        const history = pages.join(`\n\n${'---PAGE---'}\n\n`);
        const newPages = await generateNextPages(history, selectedLang, writingMode!);
        setPages(prev => [...prev, ...newPages]);
        
        // Automatically advance to the first new page if in journal mode
        if (writingMode === 'journal' && newPages.length > 0) {
            setCurrentPage(prev => prev + 1);
        }
    } catch (e: any) {
        setError(e?.message || t('error_next_pages'));
        console.error(e);
    } finally {
        clearInterval(interval);
        setGenerationProgress(100);
        setTimeout(() => setIsGeneratingMore(false), 1000);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  useEffect(() => {
    if (isGenerated) {
      storyContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isGenerated]);

  const handleReset = () => {
    setPages([]);
    setTitle('');
    setIsGenerated(false);
    setError(null);
    setCurrentPage(0);
    setWritingMode(null);
  };

  const handlePageContentChange = useCallback((index: number, newMainContentHtml: string) => {
    setPages(currentPages => {
        const newPages = [...currentPages];
        const oldPage = newPages[index];
        const footnoteDelimiter = '---FOOTNOTES---';
        const parts = oldPage.split(footnoteDelimiter);
        // Reconstruct page preserving footnotes
        newPages[index] = parts.length > 1 
            ? `${newMainContentHtml}${footnoteDelimiter}${parts[1]}`
            : newMainContentHtml;
        return newPages;
    });
  }, []);
  
  const handleNext = () => {
    if (writingMode === 'journal') {
        setCurrentPage(p => Math.min(p + 1, pages.length - 1));
    } else {
        setCurrentPage(p => Math.min(p + 2, pages.length - 1));
    }
  };

  const handlePrev = () => {
    if (writingMode === 'journal') {
        setCurrentPage(p => Math.max(p - 1, 0));
    } else {
        setCurrentPage(p => Math.max(p - 2, 0));
    }
  };

  const handleCopyAll = useCallback(() => {
    if (pages.length === 0) return;
    const allText = pages.map(page => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = page;
        // Simple text conversion, ignoring footnotes for copy
        return tempDiv.innerText.split('---FOOTNOTES---')[0].trim();
    }).join('\n\n');
    
    const textToCopy = `**${title}**\n\n${allText}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => setNotification(t('notification_copied_all')))
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setNotification(t('notification_copied_all_error'));
      });
  }, [pages, title, t]);

  const handleShare = useCallback(async () => {
    if (!isGenerated || pages.length === 0) return;
    const shareTitle = title;
    const pageToHtml = (page: string) => new DOMParser().parseFromString(page, 'text/html').body.innerText || '';
    
    const currentText = pageToHtml(pages[currentPage] || '');
    const nextPageText = (writingMode !== 'journal' && pages[currentPage + 1]) ? pageToHtml(pages[currentPage + 1]) : '';
    const shareText = `"${shareTitle}"\n\n${(currentText + ' ' + nextPageText).substring(0, 280)}...`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: window.location.href });
        setNotification(t('notification_shared'));
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            setNotification(t('notification_shared_error'));
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => setNotification(t('notification_copied_share')))
        .catch(err => {
          console.error('Failed to copy link:', err);
          setNotification(t('notification_copied_share_error'));
        });
    }
  }, [isGenerated, pages, currentPage, title, t, writingMode]);
  
  const handleVoiceCommand = (command: VoiceCommand) => {
    switch (command.type) {
      case 'reset': handleReset(); setNotification(t('notification_reset')); break;
      case 'next': handleNext(); break;
      case 'prev': handlePrev(); break;
    }
  };
  
  return (
    <div className="bg-white min-h-screen text-slate-800 flex flex-col items-center justify-center p-4 selection:bg-amber-300 selection:text-amber-900">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        {!isGenerated ? (
          <SetupForm 
            onGenerate={handleGenerate} 
            isLoading={isLoading} 
            lang={selectedLang}
            onLangChange={setSelectedLang}
            t={t}
          />
        ) : (
          <div ref={storyContainerRef} className="w-full">
            <div className="w-full flex flex-wrap gap-2 justify-center mb-4 px-4">
                <button
                    onClick={handleReset}
                    className="bg-white/70 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-lg shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 font-book"
                >
                    {writingMode === 'journal' ? t('btn_new_entry') : t('btn_new_book')}
                </button>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-white/70 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-lg shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 font-book flex items-center gap-2"
                >
                    <ShareIcon className="w-5 h-5" />
                    {t('btn_share')}
                </button>
                <GenerationProgressButton 
                    onClick={handleGenerateMore} 
                    isGenerating={isGeneratingMore} 
                    progress={generationProgress} 
                    t={t}
                    label={writingMode === 'journal' ? t('btn_generate_next_page') : undefined}
                />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-6 font-book px-4">{title}</h2>
            {pages.length > 0 && (
              <StoryBook 
                pages={pages}
                currentPage={currentPage}
                onPageContentChange={handlePageContentChange}
                onNext={handleNext}
                onPrev={handlePrev}
                mode={writingMode!}
                t={t}
              />
            )}
          </div>
        )}
        {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-md w-full font-book" role="alert">
                <strong className="font-bold">{t('error_title')}: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
      </div>
       <footer className="text-center text-slate-500 mt-8 py-4 text-sm font-book">
        <p>{t('footer_powered_by')}</p>
      </footer>
      <VoiceControl 
        onCommand={handleVoiceCommand} 
        disabled={isLoading || isGeneratingMore} 
        selectedLang={selectedLang}
      />
       {notification && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg z-50 font-book animate-fade-in-out">
              {notification}
          </div>
        )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShareView={handleShare}
        onCopyAll={handleCopyAll}
        isJournal={writingMode === 'journal'}
        t={t}
      />
    </div>
  );
};

export default App;
