import React from 'react';

interface GenerationProgressButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  progress: number;
  t: (key: string) => string;
  label?: string;
}

const GenerationProgressButton: React.FC<GenerationProgressButtonProps> = ({ onClick, isGenerating, progress, t, label }) => {
  if (!isGenerating) {
    return (
      <button
        onClick={onClick}
        disabled={isGenerating}
        className="bg-amber-500/80 backdrop-blur-sm text-amber-900 font-bold px-4 py-2 rounded-lg shadow-md hover:bg-amber-500 transition-colors focus:outline-none focus:ring-amber-600 font-book flex items-center justify-center gap-2 disabled:bg-amber-300 disabled:cursor-not-allowed min-w-[210px]"
      >
        {label || t('btn_generate_more')}
      </button>
    );
  }

  return (
    <div className="w-[210px] h-10 bg-amber-200/80 rounded-lg shadow-md overflow-hidden relative font-book flex items-center justify-center">
      <div
        className="absolute top-0 left-0 h-full bg-amber-500/80 transition-all duration-150 ease-linear"
        style={{ width: `${progress}%` }}
      ></div>
      <span className="relative z-10 font-bold text-amber-900">
        {progress < 100 ? `${t('generating_progress')}... ${progress}%` : `${t('generating_complete')}!`}
      </span>
    </div>
  );
};

export default GenerationProgressButton;