import React, { useMemo, useState, useRef, useEffect } from 'react';
import FormattingToolbar from './FormattingToolbar';

interface PageProps {
  content: string;
  pageNumber: number;
  t: (key: string) => string;
  onContentChange: (newContent: string) => void;
}

const PageComponent: React.FC<PageProps> = ({ content, pageNumber, t, onContentChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const [mainContent, setMainContent] = useState('');
  const [footnotes, setFootnotes] = useState('');

  useEffect(() => {
    if (content) {
      const parts = content.split('---FOOTNOTES---');
      setMainContent(parts[0].trim());
      setFootnotes(parts[1] ? parts[1].trim() : '');
    } else {
        setMainContent('');
        setFootnotes('');
    }
  }, [content]);

  if (!content) {
    return null;
  }

  const wordCount = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mainContent;
    return tempDiv.innerText.split(/\s+/).filter(Boolean).length || 0;
  }, [mainContent]);

  const handleFormat = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    onContentChange(editorRef.current?.innerHTML || '');
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onContentChange(e.currentTarget.innerHTML);
  };
  
  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // We delay the blur to allow clicks on the toolbar
    setTimeout(() => {
      if (!pageRef.current?.contains(document.activeElement)) {
        setIsEditing(false);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full" ref={pageRef} onFocus={handleFocus} onBlur={handleBlur}>
      <div className="relative flex-grow overflow-y-auto pr-2 flex flex-col scroll-mt-8">
        {isEditing && <FormattingToolbar onFormat={handleFormat} />}
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          className="font-book text-lg/relaxed whitespace-pre-wrap text-slate-800 text-justify flex-grow focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-md p-2 -m-2"
          dangerouslySetInnerHTML={{ __html: mainContent }}
        />
        {footnotes && (
          <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-sm text-slate-600 font-book">{t('footnotes_heading')}</h4>
              <div 
                  className="prose prose-sm prose-slate mt-2 text-xs whitespace-pre-wrap font-book" 
                  dangerouslySetInnerHTML={{ __html: footnotes.replace(/\[(\d+)\]/g, '<strong>[$1]</strong>') }} 
              />
          </div>
        )}
      </div>
      <div className="text-center text-slate-500 font-book pt-4 mt-auto">
        <span className="block">{t('page_prefix')} {pageNumber}</span>
        <span className="block text-xs text-slate-400 mt-1">~{wordCount} {t('word_count_label')}</span>
      </div>
    </div>
  );
};

export default PageComponent;