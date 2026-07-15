import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import type { ParsedResume } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResumeAIGeneratorProps {
  onGenerated: (data: ParsedResume) => void;
  prefilledRole?: string;
  prefilledExperience?: string;
  prefilledMarket?: string;
  prefilledJobDescription?: string;
}

const EXAMPLE_PROMPTS = [
  "I'm a marketing manager with 5 years of experience in B2B SaaS...",
  "I'm a software engineer who built scalable microservices at a fintech startup...",
  "I led product design for a healthcare platform serving 2M+ users...",
];

export default function ResumeAIGenerator({
  onGenerated,
  prefilledRole,
  prefilledExperience,
  prefilledMarket,
  prefilledJobDescription,
}: ResumeAIGeneratorProps) {
  const [experienceDetails, setExperienceDetails] = useState('');

  const generateMutation = trpc.ai.generateFullResume.useMutation({
    onSuccess: (data) => {
      const parsedResume: ParsedResume = {
        header: data.header || {},
        summary: data.summary || '',
        skills: data.skills || [],
        experiences: data.experiences || [],
        projects: data.projects || [],
        educations: data.educations || [],
        certifications: data.certifications || [],
        ...data,
      };
      onGenerated(parsedResume);
    },
    onError: () => {
      toast.error('Failed to generate resume. Please try again.');
    },
  });

  const handleGenerate = () => {
    if (!experienceDetails.trim()) {
      toast.error('Please describe your background first.');
      return;
    }
    generateMutation.mutate({
      jobTitle: prefilledRole || '',
      experienceDetails,
      experienceLevel: prefilledExperience,
      market: prefilledMarket,
      jobDescription: prefilledJobDescription,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Tell us about your background, roles, and achievements in your own words"
          rows={5}
          value={experienceDetails}
          onChange={(e) => setExperienceDetails(e.target.value)}
          className="bg-background text-foreground border-border rounded-xl text-sm leading-relaxed p-3.5 resize-y"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setExperienceDetails(prompt)}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
          >
            {prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}
          </button>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
        className={cn('w-full gap-2 py-5 rounded-xl text-sm')}
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating your resume...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Resume
          </>
        )}
      </Button>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>AI-drafted — review before using</span>
      </div>
    </div>
  );
}
