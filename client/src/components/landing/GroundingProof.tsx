import { XCircle, CheckCircle2 } from 'lucide-react';

export default function GroundingProof() {
  return (
    <section
      aria-label="Grounded rewrite example"
      className="border-y border-border bg-card"
    >
      <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 960, paddingTop: 72, paddingBottom: 72 }}>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            If it is not in your source, it does not stay
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            HexaCv rewrites for clarity, then checks every claim against your upload or notes.
            Filler and untraceable claims are stripped. Here is what that looks like.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted p-6">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                Before, vague
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              "Responsible for working on the company website and helping the team with
              various frontend tasks and improvements."
            </p>
          </div>

          <div className="rounded-2xl border border-verified-green/25 bg-verified-green/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-verified-green" strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-widest text-verified-green">
                After, grounded
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              "Built and maintained frontend features for the company website in React,
              collaborating with the team on reviews and releases."
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Illustrative rewrite. Same underlying fact, clearer wording. No invented metrics.
        </p>
      </div>
    </section>
  );
}
