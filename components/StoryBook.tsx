import React from 'react';
import PageComponent from './Page';
import type { Page, WritingMode } from '../types';

interface StoryBookProps {
  pages: Page[];
  currentPage: number;
  t: (key: string) => string;
  onPageContentChange: (pageIndex: number, newContent: string) => void;
  onNext: () => void;
  onPrev: () => void;
  mode: WritingMode;
}

const ArrowButton: React.FC<{ direction: 'left' | 'right'; onClick: () => void; disabled: boolean; label: string }> = ({ direction, onClick, disabled, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="absolute top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={direction === 'left' ? { left: '-24px' } : { right: '-24px' }}
        aria-label={label}
    >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-700">
            {direction === 'left' ? <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />}
        </svg>
    </button>
);

const StoryBook: React.FC<StoryBookProps> = ({ pages, currentPage, t, onPageContentChange, onNext, onPrev, mode }) => {
  if (mode === 'journal') {
    // For journal, we show one page at a time, but support pagination
    const entryContent = pages[currentPage];
    return (
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl p-8 md:p-12 relative overflow-visible">
          <div className="w-full">
            <PageComponent 
              content={entryContent} 
              pageNumber={currentPage + 1} 
              t={t} 
              onContentChange={(newContent) => onPageContentChange(currentPage, newContent)}
            />
          </div>
          <ArrowButton direction="left" onClick={onPrev} disabled={currentPage === 0} label={t('btn_previous')} />
          <ArrowButton direction="right" onClick={onNext} disabled={currentPage >= pages.length - 1} label={t('btn_next')} />
        </div>
        <div className="mt-4 text-center text-sm text-slate-600 font-book">
            {t('page_indicator_showing')} {currentPage + 1} {t('page_indicator_of')} {pages.length}
        </div>
      </div>
    );
  }

  // Book Mode
  const leftPageContent = pages[currentPage];
  const rightPageContent = pages[currentPage + 1];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Book Container */}
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl p-4 md:p-6 relative">
        <div className="flex justify-center gap-4 md:gap-8">
          {/* Left Page */}
          <div className="w-1/2 p-4 md:p-6">
            <PageComponent 
              content={leftPageContent} 
              pageNumber={currentPage + 1} 
              t={t} 
              onContentChange={(newContent) => onPageContentChange(currentPage, newContent)}
            />
          </div>
          {/* Right Page */}
          <div className="w-1/2 p-4 md:p-6 border-l border-slate-200">
            {rightPageContent ? (
              <PageComponent 
                content={rightPageContent} 
                pageNumber={currentPage + 2} 
                t={t} 
                onContentChange={(newContent) => onPageContentChange(currentPage + 1, newContent)}
              />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 font-book">
                    <p>{t('storybook_end')}</p>
                </div>
            )}
          </div>
        </div>
        {/* Navigation */}
        <ArrowButton direction="left" onClick={onPrev} disabled={currentPage === 0} label={t('btn_previous')} />
        <ArrowButton direction="right" onClick={onNext} disabled={currentPage >= pages.length - 2} label={t('btn_next')} />
      </div>

      {/* Page Indicator */}
      <div className="mt-4 text-center text-sm text-slate-600 font-book">
        {t('page_indicator_showing')} {currentPage + 1}{rightPageContent ? ` - ${currentPage + 2}` : ''} {t('page_indicator_of')} {pages.length}
      </div>
    </div>
  );
};

export default StoryBook;