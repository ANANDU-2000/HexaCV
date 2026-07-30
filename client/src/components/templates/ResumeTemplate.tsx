// ResumeTemplate.tsx
// Reusable resume template — pass a `data` prop, get a fully rendered,
// print-friendly resume back. Built for Tailwind CSS projects (React 18/19).
//
// Usage:
//   import ResumeTemplate from "./ResumeTemplate";
//   import { resumeData } from "./resumeData";
//   <ResumeTemplate data={resumeData} />
//
// Print/PDF: wrap a "Download PDF" button around window.print(), or feed
// this component's container ref into html2canvas + jsPDF (same approach
// already used in HexaCV).

import type { ResumeData } from "./ResumeTemplate.types";

interface ResumeTemplateProps {
  data: ResumeData;
  className?: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-bold tracking-wide text-emerald-700 uppercase border-b border-gray-200 pb-1 mb-2 mt-5 first:mt-0">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-4 space-y-0.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="text-[12.5px] leading-snug text-gray-800">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ResumeTemplate({ data, className = "" }: ResumeTemplateProps) {
  const { contact, summary, skills, experience, projects, education, certifications, achievements } = data;

  return (
    <div
      className={`mx-auto w-full max-w-[850px] bg-white text-gray-900 font-sans px-10 py-8 print:px-0 print:py-0 ${className}`}
    >
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold text-emerald-800 tracking-tight">{contact.name}</h1>
        <p className="text-sm text-gray-600 mt-0.5">{contact.title}</p>
        <p className="text-[12.5px] text-gray-700 mt-1">
          {contact.email}
          <span className="mx-2 text-gray-400">•</span>
          {contact.phone}
        </p>
        <p className="text-[12.5px] mt-0.5 flex justify-center items-center gap-2 flex-wrap text-gray-700">
          {contact.linkedin && (
            <a href={contact.linkedin} className="text-emerald-700 hover:underline">
              {contact.linkedin.replace(/^https?:\/\//, "")}
            </a>
          )}
          {contact.github && (
            <>
              <span className="text-gray-400">•</span>
              <a href={contact.github} className="text-emerald-700 hover:underline">
                {contact.github.replace(/^https?:\/\//, "")}
              </a>
            </>
          )}
          {contact.portfolio && (
            <>
              <span className="text-gray-400">•</span>
              <a href={contact.portfolio} className="text-emerald-700 hover:underline">
                {contact.portfolio.replace(/^https?:\/\//, "")}
              </a>
            </>
          )}
          <span className="text-gray-400">•</span>
          <span>{contact.location}</span>
        </p>
      </header>

      <hr className="border-t-2 border-emerald-700 mb-3" />

      {/* Summary */}
      <section>
        <SectionHeading>Professional Summary</SectionHeading>
        <p className="text-[12.5px] leading-snug text-gray-800">{summary}</p>
      </section>

      {/* Skills */}
      <section>
        <SectionHeading>Technical Skills</SectionHeading>
        <div className="space-y-0.5">
          {skills.map((skill, i) => (
            <p key={i} className="text-[12.5px] leading-snug">
              <span className="font-bold text-emerald-800">{skill.label}: </span>
              <span className="text-gray-800">{skill.value}</span>
            </p>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section>
        <SectionHeading>Experience</SectionHeading>
        {experience.map((job, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex justify-between items-baseline flex-wrap gap-x-2">
              <h3 className="font-bold text-[13px] text-gray-900">{job.title}</h3>
              <span className="text-[11.5px] italic text-gray-500 whitespace-nowrap">{job.dateRange}</span>
            </div>
            <BulletList items={job.bullets} />
          </div>
        ))}
      </section>

      {/* Projects */}
      <section>
        <SectionHeading>Projects</SectionHeading>
        {projects.map((cat, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <p className="text-[12px] italic font-semibold text-gray-500 mb-1">{cat.category}</p>
            {cat.projects.map((proj, j) => (
              <div key={j} className="mb-2 last:mb-0">
                <p className="text-[13px]">
                  <span className="font-bold text-gray-900">{proj.name}</span>
                  {proj.tag && <span className="text-emerald-700 font-medium"> {proj.tag}</span>}
                  <span className="text-gray-500 italic"> — {proj.stack}</span>
                  {proj.deployment && (
                    <span className="text-gray-500 italic text-[11.5px]"> {proj.deployment}</span>
                  )}
                </p>
                <BulletList items={proj.bullets} />
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <SectionHeading>Education</SectionHeading>
        {education.map((edu, i) => (
          <div key={i} className="mb-2 last:mb-0">
            <div className="flex justify-between items-baseline flex-wrap gap-x-2">
              <h3 className="font-bold text-[13px] text-gray-900">{edu.degree}</h3>
              <span className="text-[11.5px] italic text-gray-500 whitespace-nowrap">{edu.dateRange}</span>
            </div>
            <p className="text-[12px] text-gray-600">
              {edu.institution}
              {edu.detail && <> | {edu.detail}</>}
            </p>
          </div>
        ))}
      </section>

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section>
          <SectionHeading>Certifications</SectionHeading>
          <p className="text-[12.5px] text-gray-800 leading-snug">{certifications.join("  ·  ")}</p>
        </section>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <section>
          <SectionHeading>Achievements</SectionHeading>
          <BulletList items={achievements} />
        </section>
      )}
    </div>
  );
}
