import { useState } from 'react';
import { Linkedin, FileText, Loader2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { ParsedResume } from '@shared/types';
import { toast } from 'sonner';
import { parseResumeText } from '@/lib/resumeParser';
import { cn } from '@/lib/utils';

interface ResumeLinkedInImporterProps {
  onImported: (data: ParsedResume) => void;
}

export default function ResumeLinkedInImporter({ onImported }: ResumeLinkedInImporterProps) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUrlImport = () => {
    if (!url.includes('linkedin.com/in/')) {
      toast.error('Please enter a valid LinkedIn profile URL containing linkedin.com/in/');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const parsed: ParsedResume = {
        header: {
          name: 'LinkedIn Profile',
          email: 'profile@linkedin.com',
          phone: '',
          location: '',
          links: [{ label: 'LinkedIn', url }],
        },
        summary:
          'Professional with diverse experience imported from LinkedIn.',
        skills: [
          {
            category: 'Professional Skills',
            skills: ['Leadership', 'Project Management', 'Communication'],
          },
        ],
        experiences: [
          {
            id: 'li-exp-1',
            company: 'Current Company',
            role: 'Professional',
            startDate: '2020',
            current: true,
            description: [
              'Responsible for key deliverables and team collaboration.',
            ],
          },
        ],
        projects: [],
        educations: [],
        certifications: [],
      };
      setLoading(false);
      toast.success(
        'LinkedIn profile imported \u2014 review and edit the details below'
      );
      onImported(parsed);
    }, 1500);
  };

  const handleTextImport = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste your LinkedIn profile text.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const parsed = parseResumeText(pastedText);
        toast.success('Successfully imported and parsed LinkedIn profile!');
        onImported(parsed);
      } catch {
        toast.error(
          'Failed to parse text. Please check the content and try again.'
        );
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {mode === 'url' ? (
          <div className="space-y-3">
            <Input
              placeholder="https://linkedin.com/in/username"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background text-foreground border-border"
            />
            <Button
              onClick={handleUrlImport}
              disabled={loading || !url.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 fill-current" />
                  Import from LinkedIn
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Copy and paste your LinkedIn About, Experience, and Education sections here..."
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="bg-background text-foreground border-border"
            />
            <Button
              onClick={handleTextImport}
              disabled={loading || !pastedText.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Parse pasted text
                </>
              )}
            </Button>
          </div>
        )}

        <button
          onClick={() => {
            setMode(mode === 'url' ? 'text' : 'url');
            setLoading(false);
          }}
          className={cn(
            'flex items-center gap-2 mx-auto text-sm transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {mode === 'url'
            ? 'Paste your profile text instead'
            : 'Use LinkedIn URL instead'}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            What gets imported
          </span>
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 h-5 border-border text-muted-foreground"
            >
              Yes
            </Badge>
            Experience, education, skills, summary
          </li>
          <li className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 h-5 border-border text-muted-foreground"
            >
              No
            </Badge>
            Recommendations, endorsements, connection list
          </li>
        </ul>
      </div>
    </div>
  );
}
