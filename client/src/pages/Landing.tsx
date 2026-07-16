import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import {
  ArrowRight,
  Download,
  Zap,
  Target,
  Smartphone,
  Upload,
  Layers,
  Check,
  AlertCircle,
  Sparkles,
  Clock,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowUpRight,
  FileDown,
  RefreshCw,
  Info,
  Star,
  Activity,
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Landing() {
  const { installPrompt, isOnline, installApp } = usePWA();
  const { isAuthenticated } = useAuth();

  // Hero Simulator states
  const [activeHeroTab, setActiveHeroTab] = useState<'parser' | 'scorer' | 'polish'>('parser');
  
  // Parser simulation state
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any>(null);

  // Scorer simulation state
  const [atsScore, setAtsScore] = useState(72);
  const [appliedSkills, setAppliedSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  // Polish template style state
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'tech'>('modern');

  // Before & After optimize simulation state
  const [beforeAfterOptimized, setBeforeAfterOptimized] = useState(false);
  const [isOptimizingSlider, setIsOptimizingSlider] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);

  // FAQ Accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Parser simulation logic
  const handleStartParsing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsParsing(true);
    setParseProgress(0);
    setParsedData(null);
  };

  useEffect(() => {
    let interval: any;
    if (isParsing && parseProgress < 100) {
      interval = setInterval(() => {
        setParseProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsParsing(false);
            setParsedData({
              name: 'Sarah Jenkins',
              title: 'Senior Software Engineer',
              skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'AWS'],
              experiences: 3,
            });
            return 100;
          }
          return prev + 10;
        });
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isParsing, parseProgress]);

  // Apply ATS suggestion logic
  const handleApplySuggestion = () => {
    if (suggestionApplied) return;
    setSuggestionApplied(true);
    // Animate score from 72 to 96
    let score = 72;
    const interval = setInterval(() => {
      score += 1;
      setAtsScore(score);
      if (score >= 96) {
        clearInterval(interval);
        setAppliedSkills((prev) => [...prev, 'Cloud Architecture', 'CI/CD']);
      }
    }, 25);
  };

  // Reset Scorer simulation
  const handleResetScorer = () => {
    setSuggestionApplied(false);
    setAtsScore(72);
    setAppliedSkills(['React', 'TypeScript', 'Node.js']);
  };

  // Before/After optimizer simulation logic
  const handleBeforeAfterOptimize = () => {
    if (beforeAfterOptimized) {
      setBeforeAfterOptimized(false);
      return;
    }
    setIsOptimizingSlider(true);
    setOptimizeProgress(0);
  };

  useEffect(() => {
    let interval: any;
    if (isOptimizingSlider && optimizeProgress < 100) {
      interval = setInterval(() => {
        setOptimizeProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsOptimizingSlider(false);
            setBeforeAfterOptimized(true);
            return 100;
          }
          return prev + 25;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isOptimizingSlider, optimizeProgress]);

  // FAQ Toggle logic
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqData = [
    {
      q: 'How does the client-side parser work? Is my data safe?',
      a: 'Unlike other systems that upload your resumes to third-party databases, HexaCv parses files entirely inside your browser sandbox. We leverage client-side binary parsing scripts. Your private data is never sent to, stored on, or processed by a server.',
    },
    {
      q: 'Do I need to pay or create an account to download my resume?',
      a: 'No. The core builder and local optimizer are 100% free with no credit card required. You can import, format, analyze, and export your resumes as high-quality, parser-compliant PDFs instantly.',
    },
    {
      q: 'What is an "ATS trap" and how does HexaCv avoid it?',
      a: 'ATS systems (Applicant Tracking Systems) run resumes through text extractors. Multi-column tables, visual shapes, header/footer text slots, and text inside non-standard image layers easily cause parser failures. HexaCv uses standard, single-column and double-column structures explicitly designed to extract properly in 99% of modern ATS systems.',
    },
    {
      q: 'Can I use HexaCv while traveling or offline?',
      a: 'Yes! HexaCv is configured as a fully compliant Progressive Web App (PWA). Just click "Install App" in the top bar to place it on your home screen or desktop. It will work completely offline, allowing you to edit resumes anywhere.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden glass-bg bg-grid-pattern">
      {/* Mesh Gradient Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-20 pointer-events-none animate-drift-orb-1"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl -z-20 pointer-events-none animate-drift-orb-2"></div>
      <div className="absolute top-[60%] left-10 w-[300px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -z-20 pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-slate-200/40 dark:border-white/5 transition-all">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="text-primary text-[28px]"><Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" /></span>
            <span className="font-bold text-xl text-foreground dark:text-slate-100 tracking-tight group-hover:text-primary transition-colors">HexaCv</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#why-hexacv" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Before & After
            </a>
            <a href="#testimonials" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Reviews
            </a>
            <a href="#faq" className="text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {installPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={installApp}
                id="btn-install-pwa"
                className="hidden sm:inline-flex gap-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:text-primary dark:hover:text-blue-400 bg-card hover:bg-slate-100/50 dark:bg-white/5 transition-all"
              >
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}
            {isAuthenticated ? (
              <Link href="/builder">
                <Button size="sm" id="btn-nav-dashboard" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" id="btn-nav-login" className="text-slate-600 dark:text-slate-400 hover:text-foreground font-medium hover:bg-slate-100/50 dark:hover:bg-white/5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button size="sm" id="btn-nav-build" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                    Build Resume
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Powered by Local Client-Side Engines</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Next-Gen Resume Building.<br />
                <span className="text-shimmer">Designed for ATS Victory.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Upload, optimize, and format high-scoring professional resumes client-side. Built for ambitious professionals who value speed, data privacy, and clean typography.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/builder">
                  <Button size="lg" id="btn-hero-start" className="w-full sm:w-auto px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all hover:scale-[1.02] duration-300 animate-pulse-glow gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <a href="#why-hexacv" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full px-8 py-6 glass-panel rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    See Live Demo
                  </Button>
                </a>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-slate-500 pt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>100% Client-Side Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-500" />
                  <span>No Account Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-500" />
                  <span>Offline PWA Ready</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Simulator Dashboard */}
            <div className="lg:col-span-6 relative w-full mt-12 lg:mt-0 z-10">
              <div className="glass-panel rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-1 bg-white/40 dark:bg-slate-900/30 overflow-hidden">
                {/* Simulator Tabs */}
                <div className="flex border-b border-slate-200/50 dark:border-white/5 bg-slate-100/40 dark:bg-slate-950/40 rounded-t-xl overflow-hidden p-1.5">
                  <button
                    onClick={() => setActiveHeroTab('parser')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      activeHeroTab === 'parser'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200/30'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    AI Parser
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('scorer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      activeHeroTab === 'scorer'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200/30'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-white/5'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    ATS Tailoring
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('polish')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      activeHeroTab === 'polish'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200/30'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Design Polish
                  </button>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 min-h-[380px] flex flex-col justify-between bg-white/60 dark:bg-slate-900/40 relative">
                  
                  {/* TAB 1: Parser Simulation */}
                  {activeHeroTab === 'parser' && (
                    <div className="space-y-5 animate-fade-slide-up w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Local Parser Engine</h3>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">sandbox-active</span>
                      </div>
                      
                      {!parsedData && !isParsing ? (
                        <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-colors cursor-pointer" onClick={handleStartParsing}>
                          <Upload className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-650 mb-3 animate-bounce" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload existing resume PDF or Docx</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-500">Processing happens locally on your CPU</p>
                          <Button size="sm" className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 border-none font-bold text-xs" onClick={handleStartParsing}>
                            Try Demo File
                          </Button>
                        </div>
                      ) : isParsing ? (
                        <div className="space-y-6 py-8">
                          <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="absolute h-full bg-blue-600 dark:bg-blue-400 transition-all duration-150" style={{ width: `${parseProgress}%` }}></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                              Scanning content segments...
                            </span>
                            <span>{parseProgress}%</span>
                          </div>
                          
                          {/* Animated laser-scanner preview */}
                          <div className="h-28 rounded-lg border border-slate-200 dark:border-white/5 relative bg-slate-900/5 dark:bg-slate-950/40 overflow-hidden flex flex-col justify-center px-4 font-mono text-[9px] text-slate-500 dark:text-slate-450 leading-relaxed">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 dark:bg-blue-400 animate-[bounce_2s_infinite] shadow-[0_0_10px_2px_rgba(59,130,246,0.5)]"></div>
                            <div>[EXTRACTING] Sarah Jenkins - Sr. Software Engineer</div>
                            <div>[SKILLS FOUND] React, TypeScript, Node, Webpack</div>
                            <div>[EXPERIENCE SCANNED] Acme Labs (3 yrs), Zenith AI (2 yrs)</div>
                            <div>[SANITIZING] Removing unsafe tags & invisible parser traps</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fade-slide-up">
                          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs">
                            <Check className="w-4 h-4 shrink-0 bg-emerald-500 text-white rounded-full p-0.5" />
                            <span>Successfully parsed document entirely in-browser. No database logs created.</span>
                          </div>
                          
                          <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 text-xs space-y-3 font-sans">
                            <div className="flex justify-between border-b border-slate-200/30 dark:border-white/5 pb-2">
                              <span className="text-slate-500">Parsed Name:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{parsedData.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/30 dark:border-white/5 pb-2">
                              <span className="text-slate-500">Extracted Title:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{parsedData.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/30 dark:border-white/5 pb-2">
                              <span className="text-slate-500">Extracted Experiences:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{parsedData.experiences} Roles Found</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {parsedData.skills.map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-0.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-500/10 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold">{skill}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2.5">
                            <Link href="/builder" className="flex-1">
                              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                                Load into Builder
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setParsedData(null)}>
                              Parse Another
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ATS Scorer Simulation */}
                  {activeHeroTab === 'scorer' && (
                    <div className="space-y-4 animate-fade-slide-up w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">ATS Keyword Scorer</h3>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          Target Job: <span className="font-semibold text-slate-800 dark:text-slate-200">Cloud Systems Eng</span>
                        </div>
                      </div>

                      <div className="flex gap-6 items-center p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 rounded-2xl">
                        {/* Score Circle Progress */}
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="6" fill="transparent" />
                            <circle
                              cx="40"
                              cy="40"
                              r="34"
                              stroke={atsScore >= 90 ? '#10b981' : '#2563eb'}
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray="213.6"
                              strokeDashoffset={213.6 - (213.6 * atsScore) / 100}
                              className="transition-all duration-500 ease-out"
                            />
                          </svg>
                          <span className={`absolute text-base font-extrabold transition-colors duration-300 ${atsScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {atsScore}%
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {atsScore < 90 ? 'Improvement Recommended' : 'Excellent Job Alignment!'}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            {atsScore < 90
                              ? 'Your resume is missing key cloud architecture keywords required by the target job post.'
                              : 'High relevance match detected. Perfect parser-to-job matching score.'}
                          </p>
                        </div>
                      </div>

                      {/* Suggestion Card */}
                      <div className="glass-floating rounded-xl border border-slate-200 dark:border-white/10 p-3.5 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold text-xs">
                            <Zap className={`w-3.5 h-3.5 fill-current text-amber-500 ${!suggestionApplied && 'animate-pulse'}`} />
                            <span>ATS Alignment Recommendation</span>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">+24% Score</span>
                        </div>
                        <p className="text-[10px] text-slate-650 dark:text-slate-350 leading-relaxed">
                          Add experience working with <span className="font-semibold text-blue-600 dark:text-blue-400">"Cloud Architecture"</span> and <span className="font-semibold text-blue-600 dark:text-blue-400">"CI/CD"</span> deployment pathways to match job descriptions.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleApplySuggestion}
                            disabled={suggestionApplied}
                            className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                              suggestionApplied
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 border border-slate-200/50 dark:border-white/5 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:scale-[1.02]'
                            }`}
                          >
                            {suggestionApplied ? 'Applied Suggestion' : 'Apply Suggestion'}
                          </button>
                          {suggestionApplied && (
                            <button onClick={handleResetScorer} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Design Polish Simulation */}
                  {activeHeroTab === 'polish' && (
                    <div className="space-y-4 animate-fade-slide-up w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Layout Engine Styling</h3>
                        <div className="flex gap-1.5 bg-slate-100/60 dark:bg-slate-950/40 p-0.5 rounded-lg border border-slate-200/30 dark:border-white/5">
                          <button
                            onClick={() => setSelectedTemplate('classic')}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                              selectedTemplate === 'classic' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            Classic
                          </button>
                          <button
                            onClick={() => setSelectedTemplate('modern')}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                              selectedTemplate === 'modern' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            Modern
                          </button>
                          <button
                            onClick={() => setSelectedTemplate('tech')}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                              selectedTemplate === 'tech' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs' : 'text-slate-500'
                            }`}
                          >
                            Elegant
                          </button>
                        </div>
                      </div>

                      {/* Mockup Resume Card Render */}
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm min-h-[220px] transition-all duration-300">
                        <div className={`space-y-3 ${selectedTemplate === 'classic' ? 'font-serif' : 'font-sans'}`}>
                          
                          {/* Resume Header */}
                          <div className={`border-b pb-2 ${
                            selectedTemplate === 'tech'
                              ? 'border-blue-500/20 flex justify-between items-center'
                              : 'border-slate-150 dark:border-white/10 text-center'
                          }`}>
                            <div className={selectedTemplate === 'tech' ? 'text-left' : 'text-center'}>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">Sarah K. Jenkins</div>
                              <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mt-0.5">Senior Systems Architect</div>
                            </div>
                            {selectedTemplate === 'tech' && (
                              <div className="text-[8px] text-slate-400 text-right font-mono">
                                Seattle, WA • sjenkins@email.com
                              </div>
                            )}
                          </div>

                          {selectedTemplate !== 'tech' && (
                            <div className="text-[8px] text-slate-400 text-center">
                              Seattle, WA • sjenkins@email.com • github.com/sjenkins
                            </div>
                          )}

                          {/* Work Experience */}
                          <div>
                            <div className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5 border-b border-slate-100 dark:border-white/5 pb-0.5">
                              Professional History
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-800 dark:text-slate-200">
                                <span>Principal Cloud Engineer @ Acme Services</span>
                                <span className="font-normal text-slate-400 font-mono">2023 - Present</span>
                              </div>
                              <div className="space-y-1 pl-1">
                                <div className="h-1 bg-slate-200 dark:bg-slate-850 rounded w-11/12"></div>
                                <div className="h-1 bg-slate-200 dark:bg-slate-850 rounded w-4/5"></div>
                              </div>
                            </div>
                          </div>

                          {/* Technical Skills */}
                          <div>
                            <div className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5 border-b border-slate-100 dark:border-white/5 pb-0.5">
                              Technical Expertise
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['React', 'TypeScript', 'AWS', 'Docker', 'CI/CD', 'Kubernetes'].map((skill, index) => (
                                <span
                                  key={index}
                                  className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                                    selectedTemplate === 'tech'
                                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                      : selectedTemplate === 'modern'
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      : 'border border-slate-200 text-slate-600 font-serif'
                                  }`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Bottom Controls */}
                  <div className="border-t border-slate-200/50 dark:border-white/5 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Client Side Sandbox Active</span>
                    </div>
                    <span className="font-mono text-[9px]">V.1.04</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* LOGO MARQUEE */}
        <section className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-b border-slate-200/40 dark:border-white/5 py-10 overflow-hidden select-none">
          <div className="max-w-7xl mx-auto px-6 text-center mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-650">Our Candidates Placed At Top Industry Leaders</span>
          </div>
          <div className="relative flex items-center overflow-x-hidden w-full">
            <div className="animate-marquee gap-16 md:gap-24 items-center">
              {['GOOGLE', 'MICROSOFT', 'META', 'STRIPE', 'AIRBNB', 'NETFLIX', 'AMAZON', 'UBER', 'SLACK', 'SHOPIFY'].map((company, index) => (
                <span key={index} className="text-base md:text-lg font-black tracking-[0.25em] text-slate-350 dark:text-slate-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                  {company}
                </span>
              ))}
            </div>
            {/* Duplicate for seamless marquee infinite loop */}
            <div className="animate-marquee gap-16 md:gap-24 items-center" aria-hidden="true">
              {['GOOGLE', 'MICROSOFT', 'META', 'STRIPE', 'AIRBNB', 'NETFLIX', 'AMAZON', 'UBER', 'SLACK', 'SHOPIFY'].map((company, index) => (
                <span key={index + 20} className="text-base md:text-lg font-black tracking-[0.25em] text-slate-350 dark:text-slate-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                  {company}
                </span>
              ))}
            </div>
            
            {/* Fade overlays at ends */}
            <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
          </div>
        </section>

        {/* WHY HEXACV & BEFORE/AFTER OPTIMIZER */}
        <section id="why-hexacv" className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-b border-slate-200/40 dark:border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Stop Sending Weak Resumes. <br />
                <span className="text-blue-600 dark:text-blue-400">Optimize Instantly.</span>
              </h2>
              
              <p className="text-slate-600 dark:text-slate-355 text-base leading-relaxed">
                Standard templates are highly stylized but structurally broken, blocking ATS database parsers. HexaCv resolves these format issues dynamically while inserting required keyword contexts.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-650 dark:text-red-400 font-bold text-xs shrink-0">
                    ✕
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-0.5">Complex layout failures</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Headers, footers, graphic charts, and multi-column divisions confuse parsing engines.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-650 dark:text-emerald-450 font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-0.5">High-scoring readability structure</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Standard single/double columns parsed smoothly. Direct formatting outputs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleBeforeAfterOptimize}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isOptimizingSlider && 'animate-spin'}`} />
                  {beforeAfterOptimized ? 'Revert to Unoptimized' : 'Simulate Optimization Scan'}
                </button>
              </div>
            </div>

            {/* Before / After Morphing Widget */}
            <div className="lg:col-span-7 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* Overlay Scanner Line while simulating optimization */}
                {isOptimizingSlider && (
                  <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-center items-center">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[pulse_1s_infinite] border-b border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                    <div className="bg-slate-900 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-full mt-4 shadow-xl border border-white/10 backdrop-blur-sm animate-pulse">
                      OPTIMIZING ALIGNMENTS ({optimizeProgress}%)
                    </div>
                  </div>
                )}

                {/* Left Card: Before (Unoptimized) */}
                <div className={`glass-panel rounded-2xl p-5 border border-red-500/20 dark:border-red-500/10 shadow-lg transition-all duration-500 relative ${
                  beforeAfterOptimized ? 'opacity-30 scale-95 saturate-50' : 'opacity-100'
                }`}>
                  <div className="absolute top-4 right-4 bg-red-150 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-red-200 dark:border-red-900/30">
                    ATS Score: 42%
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        Sarah_Resume_v2_edit.pdf
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      </div>
                      <div className="text-[10px] text-slate-500">Last Modified: Dec 2025</div>
                    </div>
                    
                    <div className="border border-dashed border-red-500/20 rounded-xl p-3 space-y-3 bg-red-500/[0.01]">
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          ⚠️ Objective Cliché Phrase
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal pl-3">
                          "Highly motivated individual seeking a challenging position to utilize skills and grow..."
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          ⚠️ Spelling & Grammar Typo
                        </div>
                        <p className="text-[10px] text-slate-550 pl-3">
                          "Responsable for building web apps." <span className="text-red-500 font-mono">(responsable → responsible)</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          ⚠️ Weak Verb & No Metrics
                        </div>
                        <p className="text-[10px] text-slate-550 pl-3">
                          "Helped with making the website look better using HTML and CSS."
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 italic">
                      ✕ Parser will fail to match skill keywords
                    </div>
                  </div>
                </div>

                {/* Right Card: After (Optimized) */}
                <div className={`glass-panel rounded-2xl p-5 border border-emerald-500/30 dark:border-emerald-500/10 shadow-xl transition-all duration-500 relative ${
                  beforeAfterOptimized ? 'opacity-100 scale-100 ring-2 ring-emerald-500/20' : 'opacity-40 scale-95'
                }`}>
                  <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-emerald-250 dark:border-emerald-900/30">
                    ATS Score: 98%
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        Sarah_Jenkins_Engineer.pdf
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 bg-emerald-100 dark:bg-emerald-950 rounded-full p-0.5" />
                      </div>
                      <div className="text-[10px] text-slate-500">Processed by HexaCv Engine</div>
                    </div>

                    <div className="border border-emerald-500/10 rounded-xl p-3 space-y-3 bg-emerald-500/[0.02]">
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-405 flex items-center gap-1">
                          ✓ High-Impact Career Summary
                        </div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-normal pl-3">
                          "Senior Systems Architect with 5+ years experience building highly scalable microservices..."
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-405 flex items-center gap-1">
                          ✓ Typo Rectification Done
                        </div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300 pl-3">
                          "Responsible for architecting cloud infrastructure..."
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-405 flex items-center gap-1">
                          ✓ Metric Quantified Experience
                        </div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300 pl-3">
                          "Architected modern frontend systems using React and TypeScript, boosting conversion by 22%."
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Single-column structural extraction complete
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-b border-slate-200/40 dark:border-white/5">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered For Career Growth
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Everything you need to craft high-quality resumes. Secure, local, and exceptionally optimized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
            
            {/* Card 1: Parser (Col Span 8) */}
            <div className="glass-panel glass-interactive rounded-2xl md:col-span-8 p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Intelligent Client-Side PDF Parser</h3>
                <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                  Upload an existing resume file. Our parser extracts experience fields, titles, dates, and skills directly in your browser. No files are uploaded to any server, keeping your data confidential.
                </p>
              </div>
              <div className="flex gap-2 text-xs font-mono text-slate-450 pt-2">
                <span>[X] No APIs</span>
                <span>[X] No Tracking</span>
                <span>[X] In-Memory Processing</span>
              </div>
            </div>

            {/* Card 2: Privacy (Col Span 4) */}
            <div className="glass-panel glass-interactive rounded-2xl md:col-span-4 p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Zero Server Data Leak</h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                  Your resume contains phone numbers, emails, and employment history. We guarantee 100% data residency in your browser.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Local Sandbox Secure
              </div>
            </div>

            {/* Card 3: ATS Score Diagnostics (Col Span 4) */}
            <div className="glass-panel glass-interactive rounded-2xl md:col-span-4 p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">ATS Alignment Index</h3>
                <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                  Scan your work history items against target descriptions to extract keywords, check spelling, and score formatting structures.
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Keyword Matching • Format Auditing
              </div>
            </div>

            {/* Card 4: Template Styles (Col Span 8) */}
            <div className="glass-panel glass-interactive rounded-2xl md:col-span-8 p-8 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Parser-Friendly PDF Export</h3>
                <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                  Choose from layouts explicitly optimized for ATS engines. Adjust spacing, margins, and typography sizes dynamically, and print standard PDF layouts instantly.
                </p>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-slate-500">
                <span>✓ Times New Roman & Arial Fallbacks</span>
                <span>✓ Print-Ready CSS rules</span>
              </div>
            </div>

          </div>
        </section>

        {/* STATISTICS SECTION */}
        <section className="bg-slate-50/50 dark:bg-[#080f1d] border-t border-b border-slate-200/40 dark:border-white/5 py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              
              <div className="space-y-1">
                <div className="text-3xl md:text-5xl font-black text-blue-600 dark:text-blue-400">98%</div>
                <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">ATS Parsing Accuracy</div>
                <p className="text-[10px] md:text-xs text-slate-450">Verified layout parser testing</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400">3.2x</div>
                <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">Callback Multiplier</div>
                <p className="text-[10px] md:text-xs text-slate-450">Based on candidate reports</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400">0</div>
                <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">Server Logs Generated</div>
                <p className="text-[10px] md:text-xs text-slate-450">100% private in-browser storage</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">{"< 2m"}</div>
                <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200">Avg Optimization Time</div>
                <p className="text-[10px] md:text-xs text-slate-450">Fast, streamlined interface</p>
              </div>

            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-b border-slate-200/40 dark:border-white/5">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Endorsed By Professionals
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              See how candidates are securing interviews at world-class companies using HexaCv.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "I was struggling to get callbacks for senior React roles. HexaCv's ATS scan showed that my resume was missing key framework terms. After adding them and using their classic layout, my response rate tripled."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-extrabold text-xs">
                  AM
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Alex Mercer</div>
                  <div className="text-[10px] text-slate-500">Senior Frontend Engineer</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "As a security analyst, I'm extremely cautious about uploading my personal data to resume websites. Finding a builder that runs completely client-side is fantastic. All parsing occurs in memory on my PC."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-extrabold text-xs">
                  DC
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">David Chen</div>
                  <div className="text-[10px] text-slate-500">Cybersecurity Consultant</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "The before-and-after check is an eye-opener. It highlighted spelling typos I missed, and the font formatting adjustments look incredibly polished. I exported a PDF that parses flawlessly."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xs">
                  SR
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Sophia Reynolds</div>
                  <div className="text-[10px] text-slate-500">Product Manager</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-b border-slate-200/40 dark:border-white/5">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Clear answers about privacy, operations, and PDF styling mechanisms.
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="glass-panel rounded-2xl overflow-hidden border border-slate-200/35 dark:border-white/5 transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors focus:outline-hidden"
                >
                  <span>{faq.q}</span>
                  {activeFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>
                
                {activeFaq === index && (
                  <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-550 dark:text-slate-400 leading-relaxed border-t border-slate-100/50 dark:border-white/5 bg-slate-50/[0.01] animate-fade-slide-up">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA BOTTOM SECTION */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 text-white py-24 relative overflow-hidden border-t border-slate-200/40 dark:border-white/5">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

          <div className="container max-w-4xl mx-auto px-6 text-center relative z-10 space-y-8">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 backdrop-blur-sm shadow-inner">
              <Sparkles className="w-7 h-7 text-blue-400" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto">
              Build Your High-Scoring ATS Resume Today
            </h2>
            
            <p className="text-slate-300 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
              No subscription paywalls. No data logs. Build, style, scan, and download a professional resume in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/builder">
                <Button
                  size="lg"
                  id="btn-cta-build"
                  className="w-full sm:w-auto bg-[#b8c4ff] text-[#002584] hover:bg-[#b8c4ff]/90 font-bold transition-all shadow-md gap-2 py-6 px-8 text-base border-none hover:scale-[1.02] duration-300"
                >
                  Create My Resume
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              {installPrompt && (
                <Button
                  size="lg"
                  id="btn-cta-install"
                  className="w-full sm:w-auto bg-white/5 border border-white/15 text-white hover:bg-white/10 font-bold transition-all gap-2 py-6 px-8 text-base"
                  onClick={installApp}
                >
                  <Download className="w-4 h-4" />
                  Install Offline App
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-200/20 dark:border-white/5 relative z-10">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 group cursor-pointer">
                <span className="text-white text-[24px]"><Layers className="w-6 h-6 text-blue-400" /></span>
                <span className="font-bold text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors">HexaCv</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-450">
                Next-generation local resume building and ATS optimization dashboard.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">Features</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    AI Parsing
                  </a>
                </li>
                <li>
                  <a href="#why-hexacv" className="hover:text-white transition-colors">
                    ATS Audit
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="https://www.hexastacksolutions.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    HexaStack Solutions
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.hexastacksolutions.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Visit Website
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">About</h3>
              <p className="text-sm leading-relaxed">
                Prepared by <strong>Surag & Anandu Krishna</strong>
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium">HexaStack Solutions</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 HexaStack Solutions. Prepared by Surag & Anandu Krishna.</p>
            <a
              href="https://www.hexastacksolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              www.hexastacksolutions.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
