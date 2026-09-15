/**
 * Shared per-entry field bodies for resume sections.
 *
 * Both the guided wizard (ResumeScratchBuilder) and the tabbed editor
 * (ResumeEditor's resume-editor/*Tab.tsx) render these instead of each
 * re-implementing the same inputs. Wizard/editor chrome (entry cards, step
 * navigation, AI actions) stays at the call site.
 */
import { type ReactNode } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/lib/utils";
import { markBulletEdits } from "@/lib/userEditedMerge";
import {
  hasInvertedDateRange,
  resolveCurrentToggle,
} from "@/lib/resumeDates";
import type {
  Certification,
  Education,
  Experience,
  Language,
  Project,
  Reference,
  SkillCategory,
} from "@shared/types";
import {
  EDITOR_CONTROL_CLASS,
  EDITOR_INPUT_CLASS,
  EDITOR_LABEL_CLASS,
} from "@/components/resume-editor/shared";

export type SectionFieldClassNames = {
  input?: string;
  label?: string;
  checkbox?: string;
};

const defaults = (
  classNames?: SectionFieldClassNames
): Required<SectionFieldClassNames> => ({
  input: classNames?.input || EDITOR_INPUT_CLASS,
  label: classNames?.label || EDITOR_LABEL_CLASS,
  checkbox:
    classNames?.checkbox ||
    "w-4 h-4 rounded text-primary focus:ring-ring border-border bg-muted",
});

function Field({
  label,
  htmlFor,
  labelClassName,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelClassName: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {htmlFor ? (
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </Label>
      ) : (
        <Label className={labelClassName}>{label}</Label>
      )}
      {children}
    </div>
  );
}

export function ExperienceFields({
  value: exp,
  onChange,
  classNames,
  descriptionLabelAction,
  trackBulletEdits = false,
}: {
  value: Experience;
  onChange: (patch: Partial<Experience>) => void;
  classNames?: SectionFieldClassNames;
  /** Rendered beside the description label (e.g. editor's "Rewrite Bullets"). */
  descriptionLabelAction?: ReactNode;
  /** Editor tracks per-bullet manual-edit flags; the wizard does not. */
  trackBulletEdits?: boolean;
}) {
  const cls = defaults(classNames);
  const currentId = exp.id ? `current-${exp.id}` : undefined;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Company Name" labelClassName={cls.label}>
          <Input
            placeholder="Company"
            value={exp.company}
            className={cls.input}
            onChange={e => onChange({ company: e.target.value })}
          />
        </Field>
        <Field label="Job Title" labelClassName={cls.label}>
          <Input
            placeholder="e.g. Software Engineer"
            value={exp.role}
            className={cls.input}
            onChange={e => onChange({ role: e.target.value })}
          />
        </Field>
        <Field label="Start Date" labelClassName={cls.label}>
          <Input
            placeholder="Jan 2022"
            value={exp.startDate}
            className={cls.input}
            onChange={e => onChange({ startDate: e.target.value })}
          />
        </Field>
        <Field label="End Date" htmlFor={currentId} labelClassName={cls.label}>
          <Input
            placeholder="Present"
            value={exp.endDate}
            disabled={exp.current}
            className={cls.input}
            onChange={e => onChange({ endDate: e.target.value })}
          />
        </Field>
      </div>

      {hasInvertedDateRange(exp.startDate, exp.endDate) && (
        <p className="text-xs font-medium text-amber-600">
          End date is before the start date — check the dates above.
        </p>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={currentId}
          checked={exp.current}
          onChange={e =>
            onChange(resolveCurrentToggle(e.target.checked, exp.endDate))
          }
          className={cls.checkbox}
        />
        <label
          htmlFor={currentId}
          className={cn("text-xs font-semibold cursor-pointer", cls.label)}
        >
          Currently Work Here
        </label>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <Label className="text-xs">Description Bullets (one per line)</Label>
          {descriptionLabelAction}
        </div>
        <Textarea
          placeholder={
            "Designed and developed key SaaS dashboard modules\nIntegrated third-party APIs using Express"
          }
          value={exp.description.join("\n")}
          onChange={e => {
            const nextDesc = e.target.value.split("\n").filter(Boolean);
            onChange({
              description: nextDesc,
              ...(trackBulletEdits
                ? {
                    descriptionEdited: markBulletEdits(
                      exp.description || [],
                      nextDesc,
                      exp.descriptionEdited
                    ),
                  }
                : {}),
            });
          }}
          rows={3}
          className={EDITOR_CONTROL_CLASS}
        />
      </div>
    </>
  );
}

export function ProjectFields({
  value: proj,
  onChange,
  classNames,
  isValidUrl,
}: {
  value: Project;
  onChange: (patch: Partial<Project>) => void;
  classNames?: SectionFieldClassNames;
  isValidUrl?: (url: string) => boolean;
}) {
  const cls = defaults(classNames);
  const linkInvalid = isValidUrl ? !isValidUrl(proj.link || "") : false;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Project Name" labelClassName={cls.label}>
          <Input
            placeholder="My Project"
            value={proj.name}
            className={cls.input}
            onChange={e => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Date" labelClassName={cls.label}>
          <Input
            placeholder="e.g. March 2025"
            value={proj.date}
            className={cls.input}
            onChange={e => onChange({ date: e.target.value })}
          />
        </Field>
        <Field label="Technologies (comma-separated)" labelClassName={cls.label}>
          <Input
            placeholder="React, Tailwind, Node.js"
            value={(proj.technologies || []).join(", ")}
            className={cls.input}
            onChange={e =>
              onChange({
                technologies: e.target.value
                  .split(",")
                  .map(t => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <Field label="Link URL" labelClassName={cls.label}>
          <Input
            placeholder="https://github.com/..."
            value={proj.link}
            className={cn(
              cls.input,
              linkInvalid && "border-destructive focus-visible:ring-destructive"
            )}
            onChange={e => onChange({ link: e.target.value })}
          />
          {linkInvalid && (
            <span className="text-[10px] text-destructive font-medium block">
              Please enter a valid URL.
            </span>
          )}
        </Field>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="Detail what you built, technical challenges, and outcomes..."
          value={proj.description}
          onChange={e => onChange({ description: e.target.value })}
          rows={2}
          className={EDITOR_CONTROL_CLASS}
        />
      </div>
    </>
  );
}

export function EducationFields({
  value: edu,
  onChange,
  classNames,
}: {
  value: Education;
  onChange: (patch: Partial<Education>) => void;
  classNames?: SectionFieldClassNames;
}) {
  const cls = defaults(classNames);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Institution" labelClassName={cls.label}>
        <Input
          placeholder="State University"
          value={edu.institution}
          className={cls.input}
          onChange={e => onChange({ institution: e.target.value })}
        />
      </Field>
      <Field label="Degree" labelClassName={cls.label}>
        <Input
          placeholder="Bachelor of Science"
          value={edu.degree}
          className={cls.input}
          onChange={e => onChange({ degree: e.target.value })}
        />
      </Field>
      <Field label="Field of Study" labelClassName={cls.label}>
        <Input
          placeholder="Computer Science"
          value={edu.field}
          className={cls.input}
          onChange={e => onChange({ field: e.target.value })}
        />
      </Field>
      <Field label="Graduation Date" labelClassName={cls.label}>
        <Input
          placeholder="e.g. May 2023"
          value={edu.graduationDate}
          className={cls.input}
          onChange={e => onChange({ graduationDate: e.target.value })}
        />
      </Field>
      <Field label="GPA" labelClassName={cls.label}>
        <Input
          placeholder="e.g. 3.8/4.0"
          value={edu.gpa}
          className={cls.input}
          onChange={e => onChange({ gpa: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function CertificationFields({
  value: cert,
  onChange,
  classNames,
  isValidUrl,
}: {
  value: Certification;
  onChange: (patch: Partial<Certification>) => void;
  classNames?: SectionFieldClassNames;
  isValidUrl?: (url: string) => boolean;
}) {
  const cls = defaults(classNames);
  const linkInvalid = isValidUrl ? !isValidUrl(cert.link || "") : false;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Certification Name" labelClassName={cls.label}>
        <Input
          placeholder="AWS Solutions Architect"
          value={cert.name}
          className={cls.input}
          onChange={e => onChange({ name: e.target.value })}
        />
      </Field>
      <Field label="Issuer" labelClassName={cls.label}>
        <Input
          placeholder="Amazon Web Services"
          value={cert.issuer}
          className={cls.input}
          onChange={e => onChange({ issuer: e.target.value })}
        />
      </Field>
      <Field label="Issue Date" labelClassName={cls.label}>
        <Input
          placeholder="e.g. Aug 2024"
          value={cert.date}
          className={cls.input}
          onChange={e => onChange({ date: e.target.value })}
        />
      </Field>
      <Field label="Credential Link" labelClassName={cls.label}>
        <Input
          placeholder="https://..."
          value={cert.link}
          className={cn(
            cls.input,
            linkInvalid && "border-destructive focus-visible:ring-destructive"
          )}
          onChange={e => onChange({ link: e.target.value })}
        />
        {linkInvalid && (
          <span className="text-[10px] text-destructive font-medium block">
            Please enter a valid URL.
          </span>
        )}
      </Field>
    </div>
  );
}

export function LanguageFields({
  value: lang,
  onChange,
  classNames,
}: {
  value: Language;
  onChange: (patch: Partial<Language>) => void;
  classNames?: SectionFieldClassNames;
}) {
  const cls = defaults(classNames);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Language *" labelClassName={cls.label}>
        <Input
          placeholder="e.g. French"
          value={lang.language}
          className={cls.input}
          onChange={e => onChange({ language: e.target.value })}
        />
      </Field>
      <Field label="Proficiency" labelClassName={cls.label}>
        <Input
          placeholder="e.g. Professional Working, Native"
          value={lang.proficiency}
          className={cls.input}
          onChange={e => onChange({ proficiency: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function ReferenceFields({
  value: ref,
  onChange,
  classNames,
  isValidEmail,
  isValidPhone,
}: {
  value: Reference;
  onChange: (patch: Partial<Reference>) => void;
  classNames?: SectionFieldClassNames;
  isValidEmail?: (email: string) => boolean;
  isValidPhone?: (phone: string) => boolean;
}) {
  const cls = defaults(classNames);
  const availableId = ref.id ? `ref-available-${ref.id}` : undefined;
  const emailInvalid = isValidEmail ? !isValidEmail(ref.email || "") : false;
  const phoneInvalid = isValidPhone ? !isValidPhone(ref.phone || "") : false;

  return (
    <>
      <div className="flex items-center space-x-2 pb-1">
        <input
          type="checkbox"
          id={availableId}
          checked={ref.availableOnRequest}
          onChange={e => onChange({ availableOnRequest: e.target.checked })}
          className={cls.checkbox}
        />
        <Label
          htmlFor={availableId}
          className="text-xs font-semibold text-muted-foreground cursor-pointer"
        >
          Available upon request
        </Label>
      </div>

      {!ref.availableOnRequest && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name *" labelClassName={cls.label}>
            <Input
              placeholder="e.g. Jane Doe"
              value={ref.name}
              className={cls.input}
              onChange={e => onChange({ name: e.target.value })}
            />
          </Field>
          <Field label="Company" labelClassName={cls.label}>
            <Input
              placeholder="e.g. Google"
              value={ref.company}
              className={cls.input}
              onChange={e => onChange({ company: e.target.value })}
            />
          </Field>
          <Field label="Title" labelClassName={cls.label}>
            <Input
              placeholder="e.g. Director of Engineering"
              value={ref.title}
              className={cls.input}
              onChange={e => onChange({ title: e.target.value })}
            />
          </Field>
          <Field label="Email" labelClassName={cls.label}>
            <Input
              type="email"
              placeholder="jane.doe@example.com"
              value={ref.email}
              className={cn(
                cls.input,
                emailInvalid &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              onChange={e => onChange({ email: e.target.value })}
            />
            {emailInvalid && (
              <span className="text-[9px] text-destructive font-semibold block">
                Invalid email format.
              </span>
            )}
          </Field>
          <Field label="Phone" labelClassName={cls.label} className="col-span-2 sm:col-span-2">
            <Input
              placeholder="e.g. +1 (555) 019-2834"
              value={ref.phone}
              className={cn(
                cls.input,
                phoneInvalid &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              onChange={e => onChange({ phone: e.target.value })}
            />
            {phoneInvalid && (
              <span className="text-[9px] text-destructive font-semibold block">
                Invalid phone number.
              </span>
            )}
          </Field>
        </div>
      )}
    </>
  );
}

export function SkillCategoryFields({
  value: group,
  onChange,
  classNames,
  action,
}: {
  value: SkillCategory;
  onChange: (patch: Partial<SkillCategory>) => void;
  classNames?: SectionFieldClassNames;
  /** Rendered beside the category input (e.g. editor's "Remove" button). */
  action?: ReactNode;
}) {
  const cls = defaults(classNames);

  return (
    <>
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="e.g. Languages"
          value={group.category}
          className={cn(cls.input, "max-w-xs font-semibold")}
          onChange={e => onChange({ category: e.target.value })}
        />
        {action}
      </div>
      <Input
        placeholder="Skills comma separated: React, Vue"
        value={(group.skills || []).join(", ")}
        className={cls.input}
        onChange={e =>
          onChange({
            skills: e.target.value
              .split(",")
              .map(s => s.trim())
              .filter(Boolean),
          })
        }
      />
    </>
  );
}
