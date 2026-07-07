import React, { useState, useCallback } from 'react';
import type { UploadedFile } from '../types';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled: boolean;
  t: (key: string) => string;
}

const getMimeType = (file: File): { mimeType: string; readAs: 'text' | 'dataUrl' } => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'txt':
        case 'md':
            return { mimeType: 'text/plain', readAs: 'text' };
        case 'pdf':
            return { mimeType: 'application/pdf', readAs: 'dataUrl' };
        case 'docx':
            return { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', readAs: 'dataUrl' };
        default:
            if (file.type.startsWith('text/')) {
                return { mimeType: file.type, readAs: 'text' };
            }
            // For other types, we'll try to read as data URL but it might not be supported by the model
            return { mimeType: file.type, readAs: 'dataUrl' };
    }
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, disabled, t }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleNewFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    
    setError(null);
    const fileList = Array.from(newFiles);

    const existingFileNames = new Set(files.map(f => f.name));
    const newUniqueFiles = fileList.filter(f => !existingFileNames.has(f.name));

    const supportedExtensions = ['.txt', '.md', '.pdf', '.docx'];
    const filesToProcess: File[] = [];
    const rejectedFiles: string[] = [];

    newUniqueFiles.forEach(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (supportedExtensions.includes(extension) || file.type.startsWith('text/')) {
            filesToProcess.push(file);
        } else {
            rejectedFiles.push(file.name);
        }
    });

    if (rejectedFiles.length > 0) {
        setError(t('file_upload_error_unsupported'));
        console.warn(`Unsupported files rejected: ${rejectedFiles.join(', ')}`);
    }
    
    if(filesToProcess.length === 0) return;

    const readers = filesToProcess.map(file => {
      return new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        const { mimeType, readAs } = getMimeType(file);

        reader.onload = (event) => {
          if (!event.target?.result) {
            return reject(new Error(`Failed to read file: ${file.name}`));
          }
          if (readAs === 'text') {
            resolve({ name: file.name, content: event.target.result as string, mimeType });
          } else { // dataUrl
            const dataUrl = event.target.result as string;
            const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
            resolve({ name: file.name, content: base64Data, mimeType });
          }
        };
        reader.onerror = reject;

        if (readAs === 'text') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
      });
    });

    Promise.all(readers).then(newUploadedFiles => {
      const allFiles = [...files, ...newUploadedFiles];
      onFilesChange(allFiles);
    }).catch(err => {
        console.error("Error reading files:", err);
        setError('Error reading one or more files.');
    });
  }, [files, onFilesChange, t]);
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    handleNewFiles(e.dataTransfer.files);
  }, [disabled, handleNewFiles]);
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
    if (newFiles.length === 0) {
      setError(null);
    }
  };

  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
          disabled ? 'bg-slate-100 cursor-not-allowed' :
          isDragging ? 'border-amber-500 bg-amber-50' : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          id="file-upload-input"
          multiple
          onChange={(e) => handleNewFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
          accept="text/*,.md,.txt,.pdf,.docx"
        />
        <label htmlFor="file-upload-input" className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}>
          <p className="text-slate-500 font-book">{t('file_upload_cta')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('file_upload_subtext')}</p>
        </label>
      </div>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
      {files.length > 0 && (
        <div className="mt-3 space-y-1 text-sm">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex justify-between items-center bg-slate-100 p-2 rounded">
              <span className="text-slate-700 truncate pr-2">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg leading-none disabled:opacity-50"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;