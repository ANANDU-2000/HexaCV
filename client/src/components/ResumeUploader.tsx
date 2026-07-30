import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle, ChevronRight, FileText, UploadCloud } from 'lucide-react';
import { ParsedResume } from '@shared/types';
import { trpc } from '@/lib/trpc';

interface ResumeUploaderProps {
  onParsed: (data: ParsedResume) => void;
  onStartFromScratch?: () => void;
}

export default function ResumeUploader({ onParsed, onStartFromScratch }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMutation = trpc.resume.parse.useMutation();

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setSuccess(false);

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.txt') && !selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.pdf')) {
      setError('Please upload a PDF, Word document, or text file.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        if (!base64) {
          throw new Error('Failed to read file as base64 string.');
        }

        const parsed = await parseMutation.mutateAsync({
          filename: file.name,
          base64,
        });

        setSuccess(true);
        setTimeout(() => {
          onParsed(parsed);
        }, 1000);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setError(err?.message || 'Failed to process file. Please try again.');
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="text-center flex flex-col items-center gap-2 mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mb-2 shadow-inner border border-blue-200 dark:border-blue-800">
          <UploadCloud className="w-8 h-8 text-primary dark:text-blue-400" />
        </div>
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100">Let's Get Started</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload your existing resume to parse, or build from scratch.</p>
      </div>

      {/* Drag-and-Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 ${
          isDragActive 
            ? 'border-primary bg-blue-500/10 shadow-lg shadow-blue-500/10' 
            : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/8 dark:bg-blue-500/5 hover:border-primary/60 hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-lg bg-blue-100/50 dark:bg-blue-950/30 flex items-center justify-center text-primary group-hover:scale-115 transition-transform duration-300">
          <Upload className="w-6 h-6 text-primary dark:text-blue-400" />
        </div>
        
        <div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Drag and drop your file here</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports PDF, DOCX, or TXT</p>
        </div>

        <Button 
          type="button" 
          className="mt-2 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-sm"
        >
          Browse Files
        </Button>
      </div>

      {/* File Info */}
      {file && (
        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/5 shadow-sm flex items-center justify-between animate-fade-slide-up">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{file.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-650 hover:bg-red-500/10 rounded-lg font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setSuccess(false);
            }}
          >
            Remove File
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="rounded-xl shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-500/10 border-green-500/20 rounded-xl shadow-sm text-green-800 dark:text-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="font-semibold text-xs leading-relaxed">
            Resume uploaded and parsed successfully! Your information is ready to edit.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      {file && !success && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-primary hover:bg-primary/95 text-white font-bold gap-2 py-5 rounded-lg shadow-md transition-all text-sm border-none"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing Resume...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload and Parse
            </>
          )}
        </Button>
      )}

      {/* OR Divider */}
      {onStartFromScratch && !file && (
        <>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest">OR</span>
            <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
          </div>

          {/* Secondary Option Card */}
          <button 
            type="button"
            onClick={onStartFromScratch}
            className="w-full rounded-lg p-4 flex items-center gap-4 text-left border border-slate-200 dark:border-white/10 bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/8 transition-all hover:scale-[1.01] hover:shadow-sm group"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
              <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Start from Scratch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Use our step-by-step builder to create a new CV.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
        </>
      )}
    </div>
  );
}
