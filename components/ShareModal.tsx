import React from 'react';

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .826 5.68l-4.505 2.502a3.001 3.001 0 0 1 0 2.636l4.505 2.502a3 3 0 1 1-.826 1.18l-4.505-2.502a3 3 0 1 1 0-4.996l4.505-2.502a3 3 0 0 1 0-1.18Z" clipRule="evenodd" />
  </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.5 3A2.5 2.5 0 0 0 8 5.5v1.5H6.5A2.5 2.5 0 0 0 4 9.5v9A2.5 2.5 0 0 0 6.5 21h11A2.5 2.5 0 0 0 20 18.5v-9A2.5 2.5 0 0 0 17.5 7H16V5.5A2.5 2.5 0 0 0 13.5 3h-3Zm-2.5 4.5v-1.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5H8Z" clipRule="evenodd" />
  </svg>
);


interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareView: () => void;
  onCopyAll: () => void;
  isJournal: boolean;
  t: (key: string) => string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShareView, onCopyAll, isJournal, t }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md font-book transform transition-all animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 id="share-modal-title" className="text-xl font-bold text-slate-800">{t('modal_share_title')}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 transition-colors"
            aria-label={t('modal_close_btn')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Option 1: Share Current View */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-bold text-slate-800">{t('modal_share_view_title')}</h3>
            <p className="text-slate-600 text-sm mt-1 mb-3">{t('modal_share_view_desc')}</p>
            <button 
              onClick={() => { onShareView(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-amber-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <ShareIcon className="w-5 h-5" />
              {t('modal_share_view_action')}
            </button>
          </div>
          {/* Option 2: Copy Full Text */}
          <div className="bg-slate-50 p-4 rounded-lg">
            {/* FIX: Use isJournal prop to display correct title */}
            <h3 className="font-bold text-slate-800">{isJournal ? t('modal_copy_entry_text') : t('modal_copy_book_text')}</h3>
            <p className="text-slate-600 text-sm mt-1 mb-3">{t('modal_share_full_desc')}</p>
            <button 
              onClick={() => { onCopyAll(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600"
            >
              <CopyIcon className="w-5 h-5" />
              {/* FIX: Use isJournal prop to display correct button text */}
              {isJournal ? t('modal_copy_entry_text') : t('modal_copy_book_text')}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        @keyframes fade-in-out {
          0%, 100% { opacity: 0; transform: translateY(10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
