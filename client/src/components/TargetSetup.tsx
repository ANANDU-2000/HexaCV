import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Check, ChevronDown, Briefcase, FileText, ArrowLeft, Link } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/shared/ui/command';
import { ALL_COUNTRIES, type CountryInfo } from '@shared/countriesData';
import { getPresetJobs } from '@/lib/jobDescriptions';
import { cn } from '@/lib/utils';

export interface TargetSetupData {
  targetRole: string;
  experience: string;
  market: string;
  countryCode: string;
  jobDescription: string;
}

interface TargetSetupProps {
  initialRole?: string;
  initialExperience?: string;
  initialMarket?: string;
  initialCountryCode?: string;
  initialJobDescription?: string;
  onSave: (data: TargetSetupData) => void;
  onCancel: () => void;
}

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive'] as const;
const EXPERIENCE_RANGES: Record<string, string> = {
  Entry: '0–2 yrs',
  Mid: '3–5 yrs',
  Senior: '6–10 yrs',
  Executive: '10+ yrs',
};
const PRESET_TITLES = getPresetJobs().map((j) => j.title);
const MAX_JD_CHARS = 4000;
const TOTAL_STEPS = 4;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function RoleStep({
  role,
  setRole,
  search,
  setSearch,
  filtered,
}: {
  role: string;
  setRole: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filtered: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="target-role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Target job title
      </Label>
      <Input
        ref={inputRef}
        id="target-role"
        placeholder="e.g. Full-Stack Developer"
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          setSearch(e.target.value);
        }}
        className="h-12 text-base rounded-xl"
        autoComplete="off"
      />
      {search && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {filtered.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                setRole(title);
                setSearch('');
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Experience level
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all',
              value === level
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
            )}
          >
            <span>{level}</span>
            <span className="text-[10px] font-normal opacity-60">{EXPERIENCE_RANGES[level]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CountrySelectMobile({
  search,
  setSearch,
  filtered,
  selectedCode,
  onSelect,
}: {
  search: string;
  setSearch: (v: string) => void;
  filtered: CountryInfo[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pl-10 rounded-xl bg-card"
          autoComplete="off"
        />
      </div>
      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        <div className="space-y-0.5">
          {filtered.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => onSelect(country.code)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                selectedCode === country.code
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              <span className="text-lg">{country.flag}</span>
              <span className="flex-1 text-left">{country.name}</span>
              <span className="text-xs text-muted-foreground">{country.dialCode}</span>
              {selectedCode === country.code && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No countries match "{search}"
          </p>
        )}
      </div>
    </div>
  );
}

function CountrySelectDesktop({
  value,
  onChange,
  search,
  setSearch,
  filtered,
  open,
  onOpenChange,
}: {
  value: string;
  onChange: (code: string) => void;
  search: string;
  setSearch: (v: string) => void;
  filtered: CountryInfo[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const selected = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === value),
    [value],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'h-12 w-full justify-between rounded-xl border-border bg-card px-3 text-base font-normal',
            !selected && 'text-muted-foreground',
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selected.flag}</span>
              {selected.name}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Select a country...
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput
            placeholder="Search countries..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No countries found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onChange(country.code);
                    onOpenChange(false);
                  }}
                >
                  <span className="mr-2 text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                  {country.code === value && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function JobDescriptionStep({
  value,
  onChange,
  showLink,
  onToggleLink,
  linkValue,
  onLinkChange,
}: {
  value: string;
  onChange: (v: string) => void;
  showLink: boolean;
  onToggleLink: () => void;
  linkValue: string;
  onLinkChange: (v: string) => void;
}) {
  const charCount = value.length;
  const isOver = charCount > MAX_JD_CHARS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="job-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Job description
        </Label>
        <span className="text-[10px] text-muted-foreground">Optional</span>
      </div>

      {showLink ? (
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://linkedin.com/jobs/view/..."
            value={linkValue}
            onChange={(e) => onLinkChange(e.target.value)}
            className="h-12 text-base rounded-xl"
          />
          <button
            type="button"
            onClick={onToggleLink}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Paste the description instead
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Textarea
            id="job-desc"
            placeholder="Paste the full job description, key responsibilities, and required skills..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="rounded-xl resize-y text-sm leading-relaxed min-h-[140px]"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onToggleLink}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link className="h-3 w-3" />
              Paste a job link instead
            </button>
            <span
              className={cn(
                'text-[10px] tabular-nums',
                isOver ? 'text-destructive font-medium' : 'text-muted-foreground',
              )}
            >
              {charCount}/{MAX_JD_CHARS}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Adding a real job description lets our AI tailor bullet points and highlight missing keywords — you can skip this and add it later.
      </p>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i === current
              ? 'w-6 bg-primary'
              : i < current
                ? 'w-1.5 bg-primary/40'
                : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  );
}

const STEP_TITLES = ['Target Role', 'Experience', 'Country', 'Job Description'];

function MobileLayout({
  step,
  children,
  onBack,
  onContinue,
  onSkip,
  canContinue,
  isLastStep,
  hasJobDescription,
}: {
  step: number;
  children: React.ReactNode;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
  canContinue: boolean;
  isLastStep: boolean;
  hasJobDescription: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <ProgressDots current={step} total={TOTAL_STEPS} />
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto max-w-md space-y-1 pt-2 pb-4">
          <h2 className="text-xl font-bold text-foreground">{STEP_TITLES[step]}</h2>
          <p className="text-sm text-muted-foreground pb-4">
            {step === 0 && 'Enter the job title you want to target.'}
            {step === 1 && 'How many years of experience do you have?'}
            {step === 2 && 'Where do you want to work?'}
            {step === 3 && 'Paste the job description for tailored suggestions.'}
          </p>
        </div>
        <div className="mx-auto max-w-md">
          {children}
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-md">
          {isLastStep && (
            <button
              type="button"
              onClick={onSkip}
              className="mb-2 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip this step
            </button>
          )}
          <Button
            onClick={step < 3 ? onContinue : onContinue}
            disabled={!canContinue}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {step < 3 ? 'Continue' : hasJobDescription ? 'Done' : 'Skip & start'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TargetSetup({
  initialRole = '',
  initialExperience = 'Mid',
  initialMarket = '',
  initialCountryCode = '',
  initialJobDescription = '',
  onSave,
  onCancel,
}: TargetSetupProps) {
  const [role, setRole] = useState(initialRole);
  const [experience, setExperience] = useState(initialExperience || 'Mid');
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [showJobLink, setShowJobLink] = useState(false);
  const [jobLink, setJobLink] = useState('');

  const [step, setStep] = useState(0);
  const [roleSearch, setRoleSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 639px)');

  const countryName = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === countryCode)?.name || initialMarket,
    [countryCode, initialMarket],
  );

  const filteredRoles = useMemo(() => {
    const q = roleSearch.toLowerCase().trim();
    if (!q) return PRESET_TITLES.slice(0, 6);
    return PRESET_TITLES.filter((t) => t.toLowerCase().includes(q)).slice(0, 6);
  }, [roleSearch]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return ALL_COUNTRIES.filter((c) => c.isPriority);
    return ALL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    ).slice(0, 80);
  }, [countrySearch]);

  const canContinue = role.trim().length > 0;

  const handleSave = useCallback(
    (overrides?: Partial<TargetSetupData>) => {
      onSave({
        targetRole: role.trim(),
        experience,
        market: countryName,
        countryCode,
        jobDescription,
        ...overrides,
      });
    },
    [role, experience, countryName, countryCode, jobDescription, onSave],
  );

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    if (isMobile && step < 3) {
      if (step === 2 && countryCode) {
        setStep(3);
        return;
      }
      if (step === 2 && !countryCode) {
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    handleSave();
  }, [canContinue, isMobile, step, countryCode, handleSave]);

  const handleStepContinue = useCallback(() => {
    if (!canContinue) return;
    if (step < 3) {
      const next = step + 1;
      setStep(next);
      setRoleSearch('');
      setCountrySearch('');
    } else {
      handleSave();
    }
  }, [canContinue, step, handleSave]);

  const handleSkip = useCallback(() => {
    handleSave({ jobDescription: '' });
  }, [handleSave]);

  if (isMobile) {
    return (
      <MobileLayout
        step={step}
        onBack={() => (step > 0 ? setStep((s) => s - 1) : onCancel())}
        onContinue={handleStepContinue}
        onSkip={handleSkip}
        canContinue={canContinue}
        isLastStep={step === 3}
        hasJobDescription={!!jobDescription}
      >
        {step === 0 && (
          <RoleStep
            role={role}
            setRole={(v) => {
              setRole(v);
              setRoleSearch('');
            }}
            search={roleSearch}
            setSearch={setRoleSearch}
            filtered={filteredRoles}
          />
        )}
        {step === 1 && (
          <ExperienceStep value={experience} onChange={setExperience} />
        )}
        {step === 2 && (
          <CountrySelectMobile
            search={countrySearch}
            setSearch={setCountrySearch}
            filtered={filteredCountries}
            selectedCode={countryCode}
            onSelect={(code) => {
              setCountryCode(code);
              setTimeout(() => setStep(3), 200);
            }}
          />
        )}
        {step === 3 && (
          <JobDescriptionStep
            value={jobDescription}
            onChange={setJobDescription}
            showLink={showJobLink}
            onToggleLink={() => setShowJobLink(!showJobLink)}
            linkValue={jobLink}
            onLinkChange={setJobLink}
          />
        )}
      </MobileLayout>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-4 pb-8 sm:pt-12">
      <div className="w-full max-w-[640px] mx-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Tell us what you're aiming for
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This helps us tailor your resume for the right role and market.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="target-role-desktop" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target role <span className="text-destructive">*</span>
            </Label>
            <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'h-12 w-full justify-between rounded-xl border-border bg-card px-3 text-base font-normal',
                    !role && 'text-muted-foreground',
                  )}
                >
                  {role || 'e.g. Full-Stack Developer'}
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search job titles..."
                    value={roleSearch}
                    onValueChange={setRoleSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No titles found.</CommandEmpty>
                    <CommandGroup>
                      {filteredRoles.map((title) => (
                        <CommandItem
                          key={title}
                          value={title}
                          onSelect={() => {
                            setRole(title);
                            setRolePopoverOpen(false);
                            setRoleSearch('');
                          }}
                        >
                          <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                          {title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Experience level
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperience(level)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-all',
                    experience === level
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                >
                  <span>{level}</span>
                  <span className="text-[10px] font-normal opacity-60">{EXPERIENCE_RANGES[level]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target country
            </Label>
            <CountrySelectDesktop
              value={countryCode}
              onChange={setCountryCode}
              search={countrySearch}
              setSearch={setCountrySearch}
              filtered={filteredCountries}
              open={countryPopoverOpen}
              onOpenChange={setCountryPopoverOpen}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="job-desc-desktop" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Job description
              </Label>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-border">
                Optional
              </Badge>
            </div>

            {showJobLink ? (
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://linkedin.com/jobs/view/..."
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  className="h-12 text-base rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowJobLink(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Paste the description instead
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Textarea
                  id="job-desc-desktop"
                  placeholder="Paste the full job description, key responsibilities, and required skills..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  className="rounded-xl resize-y text-sm leading-relaxed min-h-[120px]"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowJobLink(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Link className="h-3 w-3" />
                    Paste a job link instead
                  </button>
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      jobDescription.length > MAX_JD_CHARS
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground',
                    )}
                  >
                    {jobDescription.length}/{MAX_JD_CHARS}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Adding a real job description lets our AI tailor bullet points and highlight missing keywords — you can skip this and add it later.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={onCancel} className="h-11 rounded-xl px-5 text-sm font-medium">
              Cancel
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={!canContinue}
              className="h-11 rounded-xl px-6 text-sm font-semibold"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
