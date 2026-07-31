import { XCircle, CheckCircle2 } from 'lucide-react';

// Light marketing tokens, kept in sync with Landing.tsx
const T = {
  surface: '#ffffff',
  elevated: '#f1f5f9',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  expense: '#dc2626',
};

export default function GroundingProof() {
  return (
    <section
      aria-label="Grounded rewrite example"
      style={{
        backgroundColor: T.surface,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 960, paddingTop: 72, paddingBottom: 72 }}>
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
            If it is not in your source, it does not stay
          </h2>
          <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: T.muted }}>
            HexaCv rewrites for clarity, then checks every claim against your upload or notes.
            Filler and untraceable claims are stripped. Here is what that looks like.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4" style={{ color: T.expense }} strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.lightMuted }}>
                Before, vague
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
              "Responsible for working on the company website and helping the team with
              various frontend tasks and improvements."
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              backgroundColor: 'rgba(22,163,74,0.05)',
              border: '1px solid rgba(22,163,74,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4" style={{ color: T.success }} strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.success }}>
                After, grounded
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: T.text }}>
              "Built and maintained frontend features for the company website in React,
              collaborating with the team on reviews and releases."
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: T.lightMuted }}>
          Illustrative rewrite. Same underlying fact, clearer wording. No invented metrics.
        </p>
      </div>
    </section>
  );
}
