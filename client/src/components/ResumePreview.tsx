import { useState, useEffect, useMemo, type Ref } from 'react';
import { Resume } from '@shared/types';
import { cn } from '@/lib/utils';
import { getTemplateById, getDefaultTemplate } from '@/lib/templates';
import type { ResumeTemplate } from '@shared/types';

interface ResumePreviewProps {
  resume: Resume;
  templateId?: string;
  zoom?: number;
  contentRef?: Ref<HTMLDivElement>;
  contentId?: string;
}

function formatDateForResume(dateStr: string, dateFormat: string): string {
  if (!dateStr) return '';
  if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'current') return dateStr;
  
  const match = dateStr.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return dateStr; // fallback for free text e.g. "Aug 2024"

  const [_, year, month, day = '01'] = match;
  let formatted = dateFormat;
  formatted = formatted.replace(/YYYY/g, year);
  formatted = formatted.replace(/MM/g, month);
  formatted = formatted.replace(/DD/g, day);
  return formatted;
}

function SectionHeading({ children, color, borderColor }: { children: React.ReactNode; color: string; borderColor: string }) {
  return (
    <h2 
      className="text-[14.5px] font-bold tracking-wider uppercase pb-1 mb-2 mt-5 first:mt-0 pdf-avoid-break"
      style={{ 
        color,
        borderBottom: `1px solid ${borderColor}`,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {children}
    </h2>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul 
      className="list-disc pl-5 space-y-1 mt-1" 
      style={{ 
        listStyleType: 'disc', 
        paddingLeft: '1.25rem',
        color,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {items.map((item, i) => (
        <li 
          key={i} 
          className="text-[13px] leading-relaxed pl-0.5"
          style={{ listStyleType: 'disc', color }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ResumePreview({ resume, templateId, zoom = 100, contentRef, contentId = 'resume-pdf-content' }: ResumePreviewProps) {
  const [countriesList, setCountriesList] = useState<any[]>([]);

  const template: ResumeTemplate = useMemo(
    () => getTemplateById(templateId || '') || getDefaultTemplate(),
    [templateId]
  );
  const { colors: tc, cornerRadius } = template.styles;
  const isDark = tc.background !== '#ffffff';

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('/countries');
        if (res.ok) {
          const data = await res.json();
          setCountriesList(data);
        }
      } catch (err) {
        console.error("Error loading countries for preview:", err);
      }
    };
    fetchCountries();
  }, []);

  // Locate sections
  const headerSection = resume.sections.find((s) => s.type === 'header');
  const summarySection = resume.sections.find((s) => s.type === 'summary');
  const skillsSection = resume.sections.find((s) => s.type === 'skills');
  const experienceSection = resume.sections.find((s) => s.type === 'experience');
  const projectsSection = resume.sections.find((s) => s.type === 'projects');
  const educationSection = resume.sections.find((s) => s.type === 'education');
  const certificationsSection = resume.sections.find((s) => s.type === 'certifications');
  const achievementsSection = resume.sections.find((s) => s.type === 'achievements');

  // Helper to check if section is visible
  const isVisible = (type: string) => {
    const sec = resume.sections.find(s => s.type === type);
    return sec ? sec.visible : false;
  };

  const header = headerSection?.content.header || {
    name: 'Your Full Name',
    jobTitle: 'Your Job Title',
    email: 'email@example.com',
    phone: '+91 00000 00000',
    location: 'City, Country',
    links: [],
    countryCode: '',
    locationFields: {}
  };

  const selectedCountry = useMemo(() => {
    return countriesList.find(c => c.code === header.countryCode);
  }, [countriesList, header.countryCode]);

  const dateFormat = selectedCountry?.dateFormat || 'DD/MM/YYYY';

  const formattedLocation = useMemo(() => {
    if (header.countryCode && header.locationFields && selectedCountry) {
      let formatted = selectedCountry.addressFormat || '{city}, {state}, {country}';
      const fields = header.locationFields as any;
      formatted = formatted.replace(/{state}/g, fields.state || '');
      formatted = formatted.replace(/{district}/g, fields.district || '');
      formatted = formatted.replace(/{city}/g, fields.city || '');
      formatted = formatted.replace(/{postalCode}/g, fields.postalCode || '');
      formatted = formatted.replace(/{country}/g, selectedCountry.name || '');

      return formatted
        .replace(/,\s*,/g, ',')
        .replace(/\s+-\s*$/g, '')
        .replace(/-\s*$/g, '')
        .replace(/,\s*$/g, '')
        .replace(/^\s*,\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
    return header.location || 'City, Country';
  }, [header, selectedCountry]);

  // Extract explicit social links
  const linkedin = header.links?.find((l: any) => l.label.toLowerCase().includes('linkedin'))?.url || '';
  const github = header.links?.find((l: any) => l.label.toLowerCase().includes('github'))?.url || '';
  const portfolio = header.links?.find((l: any) => l.label.toLowerCase().includes('portfolio') || l.label.toLowerCase().includes('website'))?.url || '';

  const bgColor = isDark ? tc.background : '#ffffff';
  const textColor = isDark ? tc.text : '#1e293b';
  const mutedColor = isDark ? tc.border : '#64748b';
  const lightText = isDark ? tc.secondary : '#475569';
  const cardBg = isDark ? '#171f33' : '#ffffff';
  const elevatedBg = isDark ? '#222a3d' : '#f8fafc';
  const cardRadius = Math.max(cornerRadius, 12);

  return (
    <div className="w-full h-full p-2 sm:p-4 overflow-auto flex justify-center items-start"
      style={{ backgroundColor: isDark ? '#0b1326' : '#f1f5f9' }}
    >
      <div
        id={contentId}
        ref={contentRef}
        className={cn(
          "shadow-xl w-[210mm] min-h-[297mm] flex flex-col p-10 origin-top"
        )}
        style={{
          zoom: zoom / 100,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: bgColor,
          color: textColor,
          borderRadius: `${cornerRadius}px`,
        }}
      >
        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: tc.accent }}>
            {header.name || 'Your Full Name'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: lightText }}>
            {(header as any).jobTitle || (header as any).title || 'Your Job Title'}
          </p>
          <p className="text-[12.5px] mt-1" style={{ color: lightText }}>
            {header.email || 'email@example.com'}
            <span className="mx-2" style={{ color: mutedColor }}>•</span>
            {header.phone || '+91 00000 00000'}
          </p>
          <p className="text-[12.5px] mt-0.5 flex justify-center items-center gap-2 flex-wrap" style={{ color: lightText }}>
            {linkedin && (
              <a href={linkedin} target="_blank" rel="noreferrer" style={{ color: tc.primary }} className="hover:underline">
                {linkedin.replace(/^https?:\/\//, "")}
              </a>
            )}
            {github && (
              <>
                <span style={{ color: mutedColor }}>•</span>
                <a href={github} target="_blank" rel="noreferrer" style={{ color: tc.primary }} className="hover:underline">
                  {github.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
            {portfolio && (
              <>
                <span style={{ color: mutedColor }}>•</span>
                <a href={portfolio} target="_blank" rel="noreferrer" style={{ color: tc.primary }} className="hover:underline">
                  {portfolio.replace(/^https?:\/\//, "")}
                </a>
              </>
            )}
            <span style={{ color: mutedColor }}>•</span>
            <span>{formattedLocation}</span>
          </p>
        </header>

        <hr style={{ borderTop: `2px solid ${tc.primary}`, marginBottom: '0.75rem' }} />

        {/* Render sections in user-defined order */}
        {[...resume.sections]
          .sort((a, b) => a.order - b.order)
          .filter((sec) => sec.type !== 'header')
          .map((sec) => {
            if (!sec.visible) return null;

            switch (sec.type) {
              case 'summary':
                if (!sec.content.summary) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Professional Summary</SectionHeading>
                    <p className="text-[13px] leading-relaxed" style={{ color: textColor }}>
                      {sec.content.summary}
                    </p>
                  </section>
                );
              case 'skills':
                if (!sec.content.skills || sec.content.skills.length === 0) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Technical Skills</SectionHeading>
                    <div className="space-y-1">
                      {sec.content.skills.map((skillGroup: any, idx: number) => (
                        <p key={idx} className="text-[13px] leading-relaxed">
                          <span className="font-semibold" style={{ color: tc.accent }}>{skillGroup.category}: </span>
                          <span style={{ color: textColor }}>
                            {Array.isArray(skillGroup.skills) ? skillGroup.skills.join(', ') : skillGroup.skills}
                          </span>
                        </p>
                      ))}
                    </div>
                  </section>
                );
              case 'experience':
                if (!sec.content.experiences || sec.content.experiences.length === 0) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Experience</SectionHeading>
                    {sec.content.experiences.map((exp: any, idx: number) => (
                      <div key={exp.id || idx} className="mb-4 last:mb-0 pdf-avoid-break"
                        style={{
                          backgroundColor: isDark ? cardBg : 'transparent',
                          borderRadius: `${cardRadius}px`,
                          padding: isDark ? '0.75rem' : '0',
                        }}
                      >
                        <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                          <h3 className="font-semibold text-[13.5px]" style={{ color: textColor }}>
                            {exp.role} | {exp.company}
                          </h3>
                          <span className="text-[11.5px] font-medium whitespace-nowrap" style={{ color: mutedColor }}>
                            {formatDateForResume(exp.startDate, dateFormat)} – {formatDateForResume(exp.endDate || 'Present', dateFormat)}
                          </span>
                        </div>
                        {exp.description && exp.description.length > 0 && (
                          <BulletList items={exp.description} color={textColor} />
                        )}
                      </div>
                    ))}
                  </section>
                );
              case 'projects':
                if (!sec.content.projects || sec.content.projects.length === 0) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Projects</SectionHeading>
                    <div className="mb-3 last:mb-0">
                      <p className="text-[12px] italic font-semibold mb-1" style={{ color: mutedColor }}>Technical Projects</p>
                      {sec.content.projects.map((proj: any, idx: number) => (
                        <div key={proj.id || idx} className="mb-2 last:mb-0 pdf-avoid-break"
                          style={{
                            backgroundColor: isDark ? cardBg : 'transparent',
                            borderRadius: `${cardRadius}px`,
                            padding: isDark ? '0.75rem' : '0',
                          }}
                        >
                          <p className="text-[13px]">
                            <span className="font-bold" style={{ color: textColor }}>{proj.name}</span>
                            {proj.link && <span style={{ color: tc.primary }} className="font-medium"> ↗ Live</span>}
                            {proj.technologies && (
                              <span className="italic" style={{ color: mutedColor }}>
                                {" "}— {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                              </span>
                            )}
                          </p>
                          {proj.description && (
                            <BulletList
                              items={
                                Array.isArray(proj.description)
                                  ? proj.description
                                  : proj.description.split('\n').filter(Boolean)
                              }
                              color={textColor}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              case 'education':
                if (!sec.content.educations || sec.content.educations.length === 0) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Education</SectionHeading>
                    {sec.content.educations.map((edu: any, idx: number) => (
                      <div key={edu.id || idx} className="mb-2 last:mb-0 pdf-avoid-break"
                        style={{
                          backgroundColor: isDark ? cardBg : 'transparent',
                          borderRadius: `${cardRadius}px`,
                          padding: isDark ? '0.75rem' : '0',
                        }}
                      >
                        <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                          <h3 className="font-bold text-[13px]" style={{ color: textColor }}>{edu.degree} in {edu.field}</h3>
                          <span className="text-[11.5px] italic whitespace-nowrap" style={{ color: mutedColor }}>
                            {formatDateForResume(edu.graduationDate, dateFormat)}
                          </span>
                        </div>
                        <p className="text-[12px]" style={{ color: lightText }}>
                          {edu.institution}
                          {edu.gpa && <> | GPA: {edu.gpa}</>}
                        </p>
                      </div>
                    ))}
                  </section>
                );
              case 'certifications':
                if (!sec.content.certifications || sec.content.certifications.length === 0) return null;
                return (
                  <section key={sec.id} className="pdf-avoid-break">
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Certifications</SectionHeading>
                    <p className="text-[12.5px] leading-snug" style={{ color: textColor }}>
                      {sec.content.certifications
                        .map((cert: any) => `${cert.name} — ${cert.issuer} (${formatDateForResume(cert.date || '', dateFormat)})`)
                        .join("  ·  ")}
                    </p>
                  </section>
                );
              case 'achievements':
                if (!sec.content.achievements || sec.content.achievements.length === 0) return null;
                return (
                  <section key={sec.id} className="pdf-avoid-break">
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Achievements</SectionHeading>
                    <BulletList items={sec.content.achievements} color={textColor} />
                  </section>
                );
              case 'languages':
                if (!sec.content.languages || sec.content.languages.length === 0) return null;
                return (
                  <section key={sec.id} className="pdf-avoid-break">
                    <SectionHeading color={tc.accent} borderColor={tc.border}>Languages</SectionHeading>
                    <p className="text-[12.5px] leading-snug" style={{ color: textColor }}>
                      {sec.content.languages
                        .map((lang: any) => `${lang.language} (${lang.proficiency || 'Conversational'})`)
                        .join("  ·  ")}
                    </p>
                  </section>
                );
              case 'references':
                if (!sec.content.references || sec.content.references.length === 0) return null;
                return (
                  <section key={sec.id}>
                    <SectionHeading color={tc.accent} borderColor={tc.border}>References</SectionHeading>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {sec.content.references.map((ref: any, idx: number) => (
                        <div key={ref.id || idx} className="text-[12px]"
                          style={{
                            backgroundColor: isDark ? cardBg : 'transparent',
                            borderRadius: `${cardRadius}px`,
                            padding: isDark ? '0.75rem' : '0',
                          }}
                        >
                          <p className="font-bold" style={{ color: textColor }}>{ref.name}</p>
                          {ref.availableOnRequest ? (
                            <p className="italic text-[11px] mt-0.5" style={{ color: mutedColor }}>Available upon request</p>
                          ) : (
                            <>
                              <p className="text-[11.5px]" style={{ color: lightText }}>{ref.title} {ref.company ? `at ${ref.company}` : ''}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: mutedColor }}>
                                {ref.email && <span>{ref.email}</span>}
                                {ref.email && ref.phone && <span className="mx-1.5">•</span>}
                                {ref.phone && <span>{ref.phone}</span>}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              case 'custom':
                if (!sec.content.customSections || sec.content.customSections.length === 0) return null;
                return (
                  <div key={sec.id} className="space-y-4">
                    {sec.content.customSections.map((customSect: any, sectIdx: number) => {
                      if (!customSect.title || !customSect.items || customSect.items.length === 0) return null;
                      return (
                        <section key={customSect.id || sectIdx}>
                          <SectionHeading color={tc.accent} borderColor={tc.border}>{customSect.title}</SectionHeading>
                          {customSect.items.map((item: any, itemIdx: number) => (
                            <div key={item.id || itemIdx} className="mb-2 last:mb-0 pdf-avoid-break"
                              style={{
                                backgroundColor: isDark ? cardBg : 'transparent',
                                borderRadius: `${cardRadius}px`,
                                padding: isDark ? '0.75rem' : '0',
                              }}
                            >
                              <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                                <h3 className="font-bold text-[13px]" style={{ color: textColor }}>{item.title}</h3>
                                {item.subtitle && (
                                  <span className="text-[11.5px] italic whitespace-nowrap" style={{ color: mutedColor }}>
                                    {item.subtitle}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[12px] leading-snug mt-0.5" style={{ color: textColor }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </section>
                      );
                    })}
                  </div>
                );
              default:
                return null;
            }
          })}
      </div>
    </div>
  );
}
