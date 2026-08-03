import type { Resume, ResumeSection } from '@shared/types';

/**
 * Sample resumes used on the landing page (hero preview + output gallery).
 * Rendered with the real ResumePreview engine so what's shown is exactly
 * what the editor exports.
 */

export const PREVIEW_PAGE_WIDTH = 794; // A4 at 96dpi, matches ResumePreview

export interface SampleSpec {
  templateId: string;
  label: string;
  name: string;
  jobTitle: string;
  location: string;
  email: string;
  phone: string;
  summary: string;
  company: string;
  bullets: string[];
  skills: { category: string; skills: string[] }[];
}

export function buildSampleResume(spec: SampleSpec): Resume {
  const sections: ResumeSection[] = [
    {
      id: 'header',
      type: 'header',
      order: 0,
      visible: true,
      content: {
        header: {
          name: spec.name,
          email: spec.email,
          phone: spec.phone,
          location: spec.location,
          links: [],
          jobTitle: spec.jobTitle,
        },
      },
    },
    {
      id: 'summary',
      type: 'summary',
      order: 1,
      visible: true,
      content: { summary: spec.summary },
    },
    {
      id: 'experience',
      type: 'experience',
      order: 2,
      visible: true,
      content: {
        experiences: [
          {
            id: 'exp-1',
            company: spec.company,
            role: spec.jobTitle,
            startDate: '2022-03',
            current: true,
            description: spec.bullets,
          },
        ],
      },
    },
    {
      id: 'skills',
      type: 'skills',
      order: 3,
      visible: true,
      content: { skills: spec.skills },
    },
  ];

  return {
    id: `sample-${spec.templateId}`,
    userId: 'sample',
    title: spec.label,
    templateId: spec.templateId,
    sections,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

export const SAMPLES: { label: string; resume: Resume }[] = [
  {
    label: 'Civil Engineer, Abu Dhabi format',
    resume: buildSampleResume({
      templateId: 'classic-ats-blue',
      label: 'Civil Engineer',
      name: 'Rashid Al Mansouri',
      jobTitle: 'Civil Engineer',
      location: 'Abu Dhabi, United Arab Emirates',
      email: 'rashid.mansouri@example.com',
      phone: '+971 56 234 8901',
      summary:
        'Civil engineer with site and structural experience in UAE construction, coordinating consultants and subcontractors through execution.',
      company: 'Gulf Infrastructure Co.',
      bullets: [
        'Coordinated site execution for a 210-unit residential tower, aligning consultants and subcontractors against the master schedule.',
        'Prepared structural shop drawings and tracked material approvals to keep the design intent intact through construction.',
      ],
      skills: [{ category: 'Core', skills: ['AutoCAD', 'STAAD Pro', 'Primavera', 'QA/QC'] }],
    }),
  },
  {
    label: 'Frontend Engineer, UAE format',
    resume: buildSampleResume({
      templateId: 'classic-ats-blue',
      label: 'Frontend Engineer',
      name: 'Aisha Rahman',
      jobTitle: 'Frontend Engineer',
      location: 'Dubai, United Arab Emirates',
      email: 'aisha.rahman@example.com',
      phone: '+971 50 123 4567',
      summary:
        'Frontend engineer with hands-on React and TypeScript experience, focused on responsive interfaces and accessible design for multicultural teams.',
      company: 'Meridian Digital',
      bullets: [
        'Built responsive React interfaces with TypeScript, working with designers on shared component patterns.',
        'Improved page accessibility and performance through code reviews and browser profiling.',
      ],
      skills: [{ category: 'Core', skills: ['React', 'TypeScript', 'CSS', 'Accessibility'] }],
    }),
  },
  {
    label: 'Data Scientist, India format',
    resume: buildSampleResume({
      templateId: 'minimal-executive',
      label: 'Data Scientist',
      name: 'Rohan Iyer',
      jobTitle: 'Data Scientist',
      location: 'Bengaluru, Karnataka, India',
      email: 'rohan.iyer@example.com',
      phone: '+91 98450 12345',
      summary:
        'Data scientist experienced in Python, SQL, and machine learning workflows, from data cleaning through model evaluation and reporting.',
      company: 'Kaveri Analytics',
      bullets: [
        'Developed machine learning models in Python and scikit-learn for customer behaviour analysis.',
        'Wrote SQL pipelines and dashboards that the product team used for weekly decisions.',
      ],
      skills: [{ category: 'Core', skills: ['Python', 'SQL', 'scikit-learn', 'Statistics'] }],
    }),
  },
  {
    label: 'DevOps Engineer, Saudi format',
    resume: buildSampleResume({
      templateId: 'technical-compact',
      label: 'DevOps Engineer',
      name: 'Omar Al Harbi',
      jobTitle: 'DevOps Engineer',
      location: 'Riyadh, Saudi Arabia',
      email: 'omar.alharbi@example.com',
      phone: '+966 55 987 6543',
      summary:
        'DevOps engineer maintaining cloud infrastructure and CI/CD pipelines, with a focus on reliability and clear runbooks.',
      company: 'Najd Cloud Services',
      bullets: [
        'Maintained AWS infrastructure with Terraform and Docker across staging and production environments.',
        'Set up CI/CD pipelines and monitoring alerts used daily by the engineering team.',
      ],
      skills: [{ category: 'Core', skills: ['AWS', 'Terraform', 'Docker', 'CI/CD'] }],
    }),
  },
];
