
import React from 'react';

const GenerationIndicator: React.FC<{ isGenerating: boolean }> = ({ isGenerating }) => {
  if (!isGenerating) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 transition-opacity duration-300">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg animate-pulse">
        <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-slate-700 font-book">পরবর্তী পৃষ্ঠা তৈরি হচ্ছে...</span>
      </div>
    </div>
  );
};

export default GenerationIndicator;
