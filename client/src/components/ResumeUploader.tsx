import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ParsedResume } from '@shared/types';
import { trpc } from '@/lib/trpc';

interface ResumeUploaderProps {
  onParsed: (data: ParsedResume) => void;
  onStartFromScratch?: () => void;
}

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ResumeUploader({ onParsed, onStartFromScratch }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const parseMutation = trpc.resume.parse.useMutation();

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Please upload a PDF, Word document, or text file.';
    }
    if (f.size > MAX_SIZE) {
      return 'File size must be less than 10MB.';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
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
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const b64 = result.split(',')[1];
          if (b64) resolve(b64);
          else reject(new Error('Failed to read file.'));
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const parsed = await parseMutation.mutateAsync({ filename: file.name, base64 });
      setSuccess(true);
      setTimeout(() => onParsed(parsed), 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to process file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 w-full max-w-xl mx-auto">
      {success ? (
        <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Resume parsed successfully!</AlertDescription>
        </Alert>
      ) : (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-colors duration-200 ${
              isDragActive
                ? 'border-primary bg-accent'
                : 'border-border bg-card hover:bg-accent/50'
            } ${isMobile ? 'min-h-[180px]' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
            />
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Drag and drop your resume here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">PDF, DOCX, TXT — up to 10MB</p>

          {file && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setSuccess(false); }}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {file && !uploading && (
            <Button onClick={handleUpload} className="w-full gap-2" size="lg">
              <Upload className="h-4 w-4" />
              Upload and Parse
            </Button>
          )}

          {file && uploading && (
            <Button disabled className="w-full gap-2" size="lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex-1">{error}</AlertDescription>
            </Alert>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3">
              <Button onClick={handleUpload} variant="outline" size="sm" className="gap-1">
                <Loader2 className="h-3 w-3" />
                Retry
              </Button>
              {onStartFromScratch && (
                <button
                  type="button"
                  onClick={onStartFromScratch}
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Build from scratch instead
                </button>
              )}
            </div>
          )}

          {!file && !error && onStartFromScratch && (
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground">OR</span>
              <div className="flex-grow border-t border-border" />
            </div>
          )}

          {!file && !error && onStartFromScratch && (
            <button
              type="button"
              onClick={onStartFromScratch}
              className="w-full rounded-lg border border-border bg-card p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Start from scratch</p>
                <p className="text-xs text-muted-foreground">Build your CV with our step-by-step editor</p>
              </div>
            </button>
          )}
        </>
      )}
    </div>
  );
}
