import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import {
  User, Palette, Bell, Shield, Trash2, Eye, EyeOff,
  ChevronDown, ChevronRight, Check, RefreshCw, Moon, Sun, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
  danger: '#dc2626',
};

type Section = 'profile' | 'preferences' | 'notifications' | 'security' | 'danger';

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
];

interface Provider { id: string; name: string; configured: boolean; }
const FALLBACK_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', configured: true },
  { id: 'gemini', name: 'Gemini', configured: false },
  { id: 'grok', name: 'Grok', configured: false },
  { id: 'openrouter', name: 'OpenRouter', configured: false },
  { id: 'huggingface', name: 'Hugging Face', configured: false },
];

const NOTIFS = [
  { id: 'marketing', label: 'Marketing emails' },
  { id: 'ats_alerts', label: 'ATS score alerts' },
  { id: 'job_matches', label: 'Job match recommendations' },
  { id: 'product_updates', label: 'Product updates' },
];

function ProfileForm() {
  const { user, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success('Profile updated');
      await utils.auth.me.invalidate();
      await refresh();
    },
    onError: (err) => toast.error(err.message || 'Could not update profile'),
  });
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateProfile.mutate({ name: name.trim() });
  };
  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
          style={{ backgroundColor: T.primary, color: 'white' }}>
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: T.text }}>{name || 'Your name'}</p>
          <p className="text-xs" style={{ color: T.muted }}>{email || 'No email on file'}</p>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold" style={{ color: T.muted }}>Full Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none min-h-11"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold" style={{ color: T.muted }}>Email</label>
        <input value={email} readOnly
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none min-h-11 opacity-80"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.muted }} />
        <p className="text-[11px]" style={{ color: T.muted }}>Email comes from your sign-in provider and cannot be edited here.</p>
      </div>
      <button type="submit" disabled={updateProfile.isPending}
        className="rounded-lg px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 min-h-11"
        style={{ backgroundColor: T.primary }}>
        {updateProfile.isPending ? <><RefreshCw className="inline h-3 w-3 animate-spin mr-1" /> Saving...</> : 'Save Changes'}
      </button>
    </form>
  );
}

function PreferencesForm() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState('en');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const optOut = !!(user as { evaluationOptOut?: boolean } | null)?.evaluationOptOut;
  const setOptOut = trpc.auth.setEvaluationOptOut.useMutation({
    onSuccess: async (data) => {
      toast.success(
        data.evaluationOptOut
          ? "Evaluation logging off — thumbs will not be stored"
          : "Evaluation logging on"
      );
      await utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not update preference"),
  });

  const providers = FALLBACK_PROVIDERS;

  return (
    <div className="space-y-5">
      {/* Theme toggle */}
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Theme</p>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} onClick={() => setTheme(t)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold capitalize transition min-h-[44px]"
              style={{
                borderColor: theme === t ? T.primary : T.outlineVariant,
                backgroundColor: theme === t ? `${T.primary}20` : T.elevated,
                color: T.text,
              }}>
              {t === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Language</p>
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none min-h-[44px]"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      {/* G2 evaluation opt-out */}
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>AI evaluation dataset</p>
        <label
          className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer min-h-[44px]"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
        >
          <div>
            <p className="text-sm" style={{ color: T.text }}>Opt out of evaluation logging</p>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>
              When on, thumbs up/down on AI rewrites are not stored. See{" "}
              <a href="/privacy#evaluation-opt-out" className="underline" style={{ color: T.primaryText }}>
                Privacy
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            aria-label={optOut ? "Turn evaluation logging on" : "Opt out of evaluation logging"}
            disabled={setOptOut.isPending}
            onClick={() => setOptOut.mutate({ optOut: !optOut })}
            className="relative h-5 w-9 shrink-0 rounded-full transition"
            style={{ backgroundColor: optOut ? T.primary : T.outlineVariant }}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${optOut ? "translate-x-4" : ""}`}
            />
          </button>
        </label>
      </div>

      {/* AI Provider picker */}
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>AI Provider</p>
        <div className="space-y-2">
          {providers.map((p) => (
            <label key={p.id} onClick={() => setSelectedProvider(p.id)}
              className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition"
              style={{
                borderColor: selectedProvider === p.id ? T.primary : T.outlineVariant,
                backgroundColor: selectedProvider === p.id ? `${T.primary}15` : T.elevated,
              }}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
                style={{
                  borderColor: selectedProvider === p.id ? T.primary : T.muted,
                  backgroundColor: selectedProvider === p.id ? T.primary : 'transparent',
                }}>
                {selectedProvider === p.id && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: T.text }}>{p.name}</p>
              </div>
              <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium`}
                style={{
                  backgroundColor: p.configured ? `${T.success}20` : T.outlineVariant,
                  color: p.configured ? T.success : T.muted,
                }}>
                <span className={`h-1.5 w-1.5 rounded-full`}
                  style={{ backgroundColor: p.configured ? T.success : T.muted }} />
                {p.configured ? 'Configured' : 'Not configured'}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsForm() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    marketing: false, ats_alerts: true, job_matches: true, product_updates: false,
  });
  return (
    <div className="space-y-3">
      {NOTIFS.map((n) => (
        <label key={n.id} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <span className="text-sm" style={{ color: T.text }}>{n.label}</span>
          <button type="button" onClick={() => setEnabled((prev) => ({ ...prev, [n.id]: !prev[n.id] }))}
            className={`relative h-5 w-9 rounded-full transition ${enabled[n.id] ? '' : ''}`}
            style={{ backgroundColor: enabled[n.id] ? T.primary : T.outlineVariant }}>
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${enabled[n.id] ? 'translate-x-4' : ''}`} />
          </button>
        </label>
      ))}
    </div>
  );
}

function SecurityForm() {
  const [showPw, setShowPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { toast.error('Fill all fields'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    setTimeout(() => { setSaving(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); toast.success('Password changed'); }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* Change password */}
      <form onSubmit={handleChangePw} className="space-y-3">
        <p className="text-sm font-bold" style={{ color: T.text }}>Change Password</p>
        <div className="space-y-1">
          <label className="text-xs font-bold" style={{ color: T.muted }}>Current Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pr-9 text-sm outline-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: T.muted }}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold" style={{ color: T.muted }}>New Password</label>
            <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold" style={{ color: T.muted }}>Confirm</label>
            <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: T.primary }}>
          {saving ? <><RefreshCw className="inline h-3 w-3 animate-spin mr-1" /> Updating...</> : 'Update Password'}
        </button>
      </form>

      <hr style={{ borderColor: T.outlineVariant }} />

      {/* 2FA */}
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Two-Factor Authentication</p>
        <p className="text-xs mb-2" style={{ color: T.muted }}>Add an extra layer of security to your account.</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => setTwoFA(!twoFA)}
            className={`relative h-5 w-9 rounded-full transition ${twoFA ? '' : ''}`}
            style={{ backgroundColor: twoFA ? T.primary : T.outlineVariant }}>
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${twoFA ? 'translate-x-4' : ''}`} />
          </button>
          <span className="text-sm" style={{ color: T.text }}>{twoFA ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>
    </div>
  );
}

function DangerZoneForm() {
  const [confirmText, setConfirmText] = useState('');
  const handleDelete = () => {
    if (confirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    toast.success('Account deleted (simulated)');
  };
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border p-4"
        style={{ borderColor: `${T.danger}40`, backgroundColor: `${T.danger}10` }}>
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: T.danger }} />
        <div>
          <p className="text-sm font-bold" style={{ color: T.danger }}>Delete Account</p>
          <p className="text-xs mt-1" style={{ color: T.muted }}>
            Permanently remove your account and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold" style={{ color: T.muted }}>
          Type <span className="font-mono" style={{ color: T.danger }}>DELETE</span> to confirm
        </label>
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: `${T.danger}40`, backgroundColor: T.elevated, color: T.text }} />
      </div>
      <button onClick={handleDelete}
        className="rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
        style={{ backgroundColor: T.danger }}>
        Delete My Account
      </button>
    </div>
  );
}

function SectionCard({ section, children, isOpen, onToggle }: {
  section: typeof SECTIONS[0];
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  const isDanger = section.id === 'danger';
  return (
    <div className="rounded-xl border overflow-hidden" style={{
      borderColor: isDanger ? `${T.danger}30` : T.outlineVariant,
      backgroundColor: T.surface,
    }}>
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 transition"
        style={{ backgroundColor: isDanger && isOpen ? `${T.danger}08` : 'transparent' }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: isDanger ? T.danger : T.primaryText }} />
          <span className="text-sm font-bold" style={{ color: isDanger && isOpen ? T.danger : T.text }}>
            {section.label}
          </span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function UserSettings() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [mobileOpenSections, setMobileOpenSections] = useState<Record<string, boolean>>({});

  const toggleMobile = (id: string) =>
    setMobileOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderSectionContent = (sectionId: Section) => {
    switch (sectionId) {
      case 'profile': return <ProfileForm />;
      case 'preferences': return <PreferencesForm />;
      case 'notifications': return <NotificationsForm />;
      case 'security': return <SecurityForm />;
      case 'danger': return <DangerZoneForm />;
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-extrabold mb-1" style={{ color: T.text }}>Settings</h1>
        {SECTIONS.map((s) => (
          <SectionCard key={s.id} section={s} isOpen={!!mobileOpenSections[s.id]} onToggle={() => toggleMobile(s.id)}>
            {renderSectionContent(s.id)}
          </SectionCard>
        ))}
      </div>
    );
  }

  /* Desktop: 25/75 split */
  return (
    <div className="flex gap-6 h-full">
      {/* Nav */}
      <div className="w-56 shrink-0 space-y-1">
        <h2 className="text-sm font-bold mb-3 px-3" style={{ color: T.muted }}>Settings</h2>
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isDanger = s.id === 'danger';
          const active = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-bold transition"
              style={{
                backgroundColor: active ? `${isDanger ? T.danger : T.primary}20` : 'transparent',
                color: active ? (isDanger ? T.danger : T.text) : T.muted,
              }}>
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 rounded-xl border p-5" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <h3 className="text-base font-bold mb-4" style={{ color: T.text }}>
          {SECTIONS.find((s) => s.id === activeSection)?.label}
        </h3>
        {renderSectionContent(activeSection)}
      </div>
    </div>
  );
}
