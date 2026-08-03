import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';
import { Link } from 'wouter';

type MethodSelectorCardProps = {
  icon: LucideIcon;
  title: string;
  bullets: string[];
  href: string;
};

/**
 * Direct-click entry card for the Landing hero.
 * Whole card is a Link into /builder?mode=… — no separate Continue step.
 */
export default function MethodSelectorCard({
  icon: Icon,
  title,
  bullets,
  href,
}: MethodSelectorCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-border bg-card text-card-foreground no-underline outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-11 overflow-hidden"
      aria-label={`${title} — start building`}
    >
      {/* Verified-green top accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-verified-green"
      />

      <div className="flex flex-col gap-4 p-6 pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          {/* Non-color hover/focus confirmation marker */}
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border text-transparent transition-all group-hover:border-verified-green group-hover:bg-verified-green group-hover:text-white group-focus-visible:border-verified-green group-focus-visible:bg-verified-green group-focus-visible:text-white"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        </div>

        <h3 className="text-lg font-extrabold leading-snug tracking-tight text-foreground">
          {title}
        </h3>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-verified-green"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
