import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Loader2, Linkedin, Upload, FileText, AlertCircle } from 'lucide-react';
import { ParsedResume } from '@shared/types';
import { toast } from 'sonner';
import {
  validateResumeFile,
  useResumeUpload,
} from '@/_core/hooks/useResumeUpload';
import { Alert, AlertDescription } from '@/shared/ui/alert';

interface ResumeLinkedInImporterProps {
  onImported: (data: ParsedResume) => void;
}

export default function ResumeLinkedInImporter({ onImported }: ResumeLinkedInImporterProps) {
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { parseFile, parseText, parsing: loading, error, setError } = useResumeUpload();

  const handleTextImport = async () => {
    const text = pastedText.trim();
    if (!text) {
      toast.error('Please paste your LinkedIn profile text.');
      return;
    }

    const parsed = await parseText(text, 'linkedin-profile.txt');
    if (!parsed) return;
    toast.success('Successfully imported and parsed LinkedIn profile!');
    onImported(parsed);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const validationError = validateResumeFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleFileImport = async () => {
    if (!file) return;

    // PDF and TXT: same base64 → resume.parse path (server extractText handles both)
    const parsed = await parseFile(file);
    if (!parsed) return;
    toast.success('Successfully parsed LinkedIn profile export!');
    onImported(parsed);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Linkedin className="w-5 h-5 fill-current" />
          Import from LinkedIn
        </CardTitle>
        <CardDescription>
          No live LinkedIn connection. Paste your profile text, or upload your LinkedIn PDF/data
          export (More → Save to PDF on LinkedIn).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="linkedin-text">Paste Profile Text</Label>
          <Textarea
            id="linkedin-text"
            placeholder="Paste your About section, experience cards, and skills here..."
            rows={5}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <Button
            onClick={handleTextImport}
            disabled={loading || !pastedText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing text...
              </>
            ) : (
              <>
                <Linkedin className="w-4 h-4 fill-current" />
                Parse pasted profile
              </>
            )}
          </Button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">Or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="space-y-4">
          <Label>Upload LinkedIn PDF or text export</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.txt"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">
                {file ? file.name : 'Select PDF or .txt export'}
              </p>
              <p className="text-xs text-slate-500">Supports PDF or plain text — not a live LinkedIn login</p>
            </div>
          </div>

          {file && (
            <Button
              onClick={handleFileImport}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Extract from {file.name}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
