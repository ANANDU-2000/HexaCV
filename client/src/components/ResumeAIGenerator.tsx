import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ParsedResume } from '@shared/types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ResumeAIGeneratorProps {
  onGenerated: (data: ParsedResume) => void;
  prefilledRole?: string;
  prefilledExperience?: string;
  prefilledMarket?: string;
  prefilledJobDescription?: string;
}

export default function ResumeAIGenerator({ 
  onGenerated, 
  prefilledRole, 
  prefilledExperience, 
  prefilledMarket, 
  prefilledJobDescription 
}: ResumeAIGeneratorProps) {
  const [jobTitle, setJobTitle] = useState(prefilledRole || '');
  const [experienceLevel, setExperienceLevel] = useState(prefilledExperience || '3–5 yrs');
  const [market, setMarket] = useState(prefilledMarket || 'Global');
  const [experienceDetails, setExperienceDetails] = useState('');
  const [jobDescription, setJobDescription] = useState(prefilledJobDescription || '');

  const generateMutation = trpc.ai.generateFullResume.useMutation({
    onSuccess: (data) => {
      toast.success('Resume generated successfully!');
      // Map generated response to ParsedResume format
      const parsedResume: ParsedResume = {
        header: data.header || {},
        summary: data.summary || '',
        skills: data.skills || [],
        experiences: data.experiences || [],
        projects: data.projects || [],
        educations: data.educations || [],
        certifications: data.certifications || [],
        // Fallback for fields not present in ParsedResume definition but in output
        ...data
      };
      onGenerated(parsedResume);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to generate resume. Using template structure.');
    }
  });

  const handleGenerate = () => {
    const finalJobTitle = prefilledRole || jobTitle;
    if (!finalJobTitle.trim()) {
      toast.error('Please enter a target job title.');
      return;
    }
    generateMutation.mutate({
      jobTitle: finalJobTitle,
      experienceLevel: prefilledExperience || experienceLevel,
      market: prefilledMarket || market,
      experienceDetails,
      jobDescription: prefilledJobDescription || jobDescription
    });
  };

  const hasPrefilled = !!(prefilledRole && prefilledExperience && prefilledMarket);

  return (
    <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-md">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 p-6">
        <CardTitle className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100 text-lg">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          Smart Resume Generator
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
          Provide your background highlights to auto-generate a tailored resume matching your target preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {hasPrefilled && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs space-y-1">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Profile Configuration</span>
            <div className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed font-semibold">
              Role: <span className="text-blue-600 dark:text-blue-400">{prefilledRole}</span> &middot; Experience: <span className="text-blue-600 dark:text-blue-400">{prefilledExperience}</span> &middot; Market: <span className="text-blue-600 dark:text-blue-400">{prefilledMarket}</span>
            </div>
            {prefilledJobDescription && (
              <p className="text-[10px] text-slate-500 dark:text-slate-550 italic mt-1 truncate">
                Job Description aligned: "{prefilledJobDescription.slice(0, 80)}..."
              </p>
            )}
          </div>
        )}

        {!hasPrefilled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="target-role" className="font-semibold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">Target Job Title *</Label>
              <Input
                id="target-role"
                placeholder="e.g. Generative AI Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 py-5 text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience-level" className="font-semibold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger id="experience-level" className="w-full rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 py-5 text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                    <SelectItem value="Fresher">Fresher</SelectItem>
                    <SelectItem value="1–3 yrs">1–3 yrs</SelectItem>
                    <SelectItem value="3–5 yrs">3–5 yrs</SelectItem>
                    <SelectItem value="5–8 yrs">5–8 yrs</SelectItem>
                    <SelectItem value="8+ yrs">8+ yrs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-market" className="font-semibold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">Target Market</Label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger id="target-market" className="w-full rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 py-5 text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Gulf">Gulf</SelectItem>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="Global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="experience-summary" className="font-semibold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">Your Background & Highlights</Label>
          <Textarea
            id="experience-summary"
            placeholder="e.g. 5 years of experience building React apps, worked at Google and Stripe, designed high-performance billing system, proficient in GraphQL..."
            rows={4}
            value={experienceDetails}
            onChange={(e) => setExperienceDetails(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 text-sm leading-relaxed p-3.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>

        {!hasPrefilled && (
          <div className="space-y-2">
            <Label htmlFor="job-description" className="font-semibold text-slate-700 dark:text-slate-350 text-xs uppercase tracking-wider">Job Description (Optional)</Label>
            <Textarea
              id="job-description"
              placeholder="Paste target job description to match keywords and align resume layout to requirements..."
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 text-sm leading-relaxed p-3.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 py-6 rounded-xl shadow-md hover:shadow transition-all text-sm mt-2"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Resume...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with HexaSmart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
