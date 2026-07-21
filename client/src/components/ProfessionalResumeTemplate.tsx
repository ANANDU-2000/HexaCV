import { Resume } from '@shared/types';

interface ProfessionalResumeTemplateProps {
  resume: Resume;
}

/**
 * Single professional resume template - ATS-optimized, clean, modern design
 * Based on Surag's reference resume structure
 */
export default function ProfessionalResumeTemplate({ resume }: ProfessionalResumeTemplateProps) {
  const headerSection = resume.sections.find((s) => s.type === 'header');
  const summarySection = resume.sections.find((s) => s.type === 'summary');
  const skillsSection = resume.sections.find((s) => s.type === 'skills');
  const experienceSection = resume.sections.find((s) => s.type === 'experience');
  const projectsSection = resume.sections.find((s) => s.type === 'projects');
  const educationSection = resume.sections.find((s) => s.type === 'education');
  const certificationsSection = resume.sections.find((s) => s.type === 'certifications');

  const header = headerSection?.content.header || {
    name: 'Your Name',
    email: 'email@example.com',
    phone: '+1 (555) 123-4567',
    location: 'City, State',
  };

  return (
    <div className="bg-white text-slate-900 p-8 md:p-12 max-w-4xl mx-auto font-sans leading-relaxed">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-slate-300">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">{header.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          {header.email && <span>{header.email}</span>}
          {header.phone && (
            <>
              <span>•</span>
              <span>{header.phone}</span>
            </>
          )}
          {header.location && (
            <>
              <span>•</span>
              <span>{header.location}</span>
            </>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {summarySection?.visible && summarySection?.content.summary && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Professional Summary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{summarySection.content.summary}</p>
        </div>
      )}

      {/* Technical Skills */}
      {skillsSection?.visible && skillsSection?.content.skills && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Technical Skills
          </h2>
          <div className="space-y-2">
            {skillsSection.content.skills.map((skillGroup: any, idx: number) => (
              <div key={idx}>
                <span className="text-sm font-semibold text-slate-900">{skillGroup.category}</span>
                <span className="text-sm text-slate-700 ml-2">
                  {Array.isArray(skillGroup.skills)
                    ? skillGroup.skills.join(', ')
                    : skillGroup.skills}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experienceSection?.visible && experienceSection?.content.experiences && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Experience
          </h2>
          <div className="space-y-4">
            {experienceSection.content.experiences.map((exp: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                </div>
                {exp.description && (
                  <ul className="mt-2 space-y-1 ml-4">
                    {(Array.isArray(exp.description) ? exp.description : [exp.description]).map(
                      (bullet: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700 list-disc">
                          {bullet}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projectsSection?.visible && projectsSection?.content.projects && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Projects
          </h2>
          <div className="space-y-3">
            {projectsSection.content.projects.map((proj: any, idx: number) => (
              <div key={idx}>
                <h3 className="text-sm font-bold text-slate-900">{proj.name}</h3>
                {proj.technologies && (
                  <p className="text-xs text-slate-600 italic">{proj.technologies}</p>
                )}
                {proj.description && (
                  <p className="text-sm text-slate-700 mt-1">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {educationSection?.visible && educationSection?.content.educations && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Education
          </h2>
          <div className="space-y-2">
            {educationSection.content.educations.map((edu: any, idx: number) => {
              const cleanField = (() => {
                if (!edu.field) return '';
                const f = String(edu.field).trim();
                if (f.includes('•') || f.length > 80 || /\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(f)) {
                  const candidate = f.split(/[\n•;]| - /)[0].trim();
                  return candidate.length <= 50 && !/\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(candidate) ? candidate : '';
                }
                return f;
              })();
              return (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {edu.degree || 'Education'}{cleanField ? ` - ${cleanField}` : ''}
                      </h3>
                      <p className="text-sm text-slate-600">{edu.institution}</p>
                    </div>
                    {edu.graduationDate && (
                      <span className="text-xs text-slate-500">{edu.graduationDate}</span>
                    )}
                  </div>
                  {edu.gpa && <p className="text-xs text-slate-500 mt-0.5">GPA: {edu.gpa}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certificationsSection?.visible && certificationsSection?.content.certifications && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 pb-2 border-b border-slate-300">
            Certifications
          </h2>
          <div className="space-y-2">
            {certificationsSection.content.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cert.name}</p>
                  {cert.issuer && <p className="text-sm text-slate-600">{cert.issuer}</p>}
                </div>
                {cert.date && <span className="text-xs text-slate-500">{cert.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>Created with HexaCv by HexaStack Solutions</p>
      </div>
    </div>
  );
}
