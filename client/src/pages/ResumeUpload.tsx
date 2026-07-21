import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2, Upload, UploadCloud, FileText, X, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import { useAuth } from '@/_core/hooks/useAuth';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import { nanoid } from 'nanoid';
import type { ParsedResume } from '@shared/types';

const T = {
  bg: '#0b1326',
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  border: '#1e293b',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
  error: '#ffb4ab',
  radius: 8,
};

export default function ResumeUpload() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const storage = useResumeStorage();
  const parseMutation = trpc.resume.parse.useMutation();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setSuccess(false);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(selectedFile.type) && !['txt', 'docx', 'pdf', 'doc'].includes(ext || '')) {
      setError('Please upload a PDF, Word document, or text file.');
      return;
    }

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleParse = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 90));
    }, 300);

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

        clearInterval(interval);
        setProgress(100);

        const saved = await storage.saveResume(createResumeFromParsed(parsed));
        setSuccess(true);
        toast.success('Resume parsed and saved!');

        setTimeout(() => {
          setLocation('/dashboard/builder/edit');
        }, 1500);
      } catch (err: any) {
        clearInterval(interval);
        setProgress(0);
        setError(err?.message || 'Failed to process file. Please try again.');
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      clearInterval(interval);
      setProgress(0);
      setError('Failed to read file.');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const createResumeFromParsed = (parsed: ParsedResume) => {
    const sections = [
      {
        id: nanoid(),
        type: 'header' as const,
        order: 1,
        visible: true,
        content: {
          header: {
            name: parsed.header?.name || '',
            email: parsed.header?.email || '',
            phone: parsed.header?.phone || '',
            location: parsed.header?.location || '',
            links: parsed.header?.links || [],
            jobTitle: parsed.header?.jobTitle || '',
            targetRole: parsed.header?.targetRole || parsed.header?.jobTitle || '',
            countryCode: parsed.header?.countryCode || '',
            locationFields: parsed.header?.locationFields || {},
            targetCountryCode: parsed.header?.targetCountryCode || '',
          },
        },
      },
      { id: nanoid(), type: 'summary' as const, order: 2, visible: true, content: { summary: parsed.summary || '' } },
      { id: nanoid(), type: 'skills' as const, order: 3, visible: true, content: { skills: parsed.skills || [] } },
      { id: nanoid(), type: 'experience' as const, order: 4, visible: true, content: { experiences: parsed.experiences || [] } },
      { id: nanoid(), type: 'projects' as const, order: 5, visible: true, content: { projects: parsed.projects || [] } },
      { id: nanoid(), type: 'education' as const, order: 6, visible: true, content: { educations: parsed.educations || [] } },
      { id: nanoid(), type: 'certifications' as const, order: 7, visible: true, content: { certifications: parsed.certifications || [] } },
      { id: nanoid(), type: 'achievements' as const, order: 8, visible: true, content: { achievements: parsed.achievements || [] } },
      { id: nanoid(), type: 'languages' as const, order: 9, visible: true, content: { languages: parsed.languages || [] } },
      { id: nanoid(), type: 'references' as const, order: 10, visible: true, content: { references: parsed.references || [] } },
    ];

    return ensureStandardResumeSections({
      id: nanoid(),
      userId: isAuthenticated ? 'user' : 'guest',
      title: parsed.header?.name ? `${parsed.header.name}'s Resume` : 'Untitled Resume',
      templateId: 'classic-ats-blue' as const,
      sections,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Upload your resume
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          We'll parse it so you can edit, enhance, and export.
        </p>
      </div>

      <div className="sm:max-w-[640px] sm:mx-auto">
        <div
          className="rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-300"
          style={{
            borderColor: isDragActive ? T.primary : T.outlineVariant,
            backgroundColor: isDragActive ? 'rgba(30, 64, 175, 0.08)' : T.surface,
            minHeight: '200px',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !file && fileInputRef.current?.click()}
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

          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: T.elevated }}
          >
            <UploadCloud className="h-6 w-6" style={{ color: T.primaryText }} />
          </div>

          <div>
            {file ? (
              <p className="text-sm font-bold" style={{ color: T.text }}>
                {file.name}
              </p>
            ) : (
              <>
                <p className="text-sm font-bold" style={{ color: T.text }}>
                  Tap to upload your resume
                </p>
                <p className="mt-1 text-xs" style={{ color: T.muted }}>
                  or drag and drop
                </p>
              </>
            )}
          </div>

          <p className="text-xs" style={{ color: T.muted }}>
            Supported formats: PDF, DOCX, TXT
          </p>
        </div>

        {file && !success && (
          <div
            className="mt-4 flex items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: T.elevated }}
            >
              <FileText className="h-4 w-4" style={{ color: T.primaryText }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold" style={{ color: T.text }}>{file.name}</p>
              <p className="text-xs" style={{ color: T.muted }}>{formatFileSize(file.size)}</p>
            </div>
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setSuccess(false);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-red-500/10"
                style={{ color: T.error }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {uploading && (
          <div className="mt-4 space-y-2">
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: T.elevated }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: T.primary }}
              />
            </div>
            <p className="text-xs font-medium" style={{ color: T.muted }}>
              Reading your resume...
            </p>
          </div>
        )}

        {error && (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium"
            style={{ borderColor: '#ffb4ab40', backgroundColor: '#ffb4ab15', color: T.error }}
          >
            <span className="text-sm">⚠</span>
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium"
            style={{ backgroundColor: '#16a34a20', color: T.success }}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            Resume uploaded and parsed! Opening editor...
          </div>
        )}

        {file && !uploading && !success && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setLocation('/dashboard/builder')}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition hover:opacity-80 sm:order-first"
              style={{ color: T.muted, backgroundColor: T.elevated }}
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:order-last"
              style={{ backgroundColor: T.accent }}
            >
              <Upload className="h-4 w-4" />
              Parse & Continue
            </button>
          </div>
        )}

        {uploading && (
          <button
            disabled
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white opacity-60"
            style={{ backgroundColor: T.accent }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing...
          </button>
        )}
      </div>
    </div>
  );
}
