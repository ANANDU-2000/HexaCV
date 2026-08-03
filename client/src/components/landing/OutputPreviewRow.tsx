import ResumePreview from '@/components/ResumePreview';
import type { Resume, ResumeSection } from '@shared/types';

/** A4 page width used by ResumePreview; scale down to fit the card frame. */
const PREVIEW_PAGE_WIDTH = 794;
const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 340;
const SCALE = FRAME_WIDTH / PREVIEW_PAGE_WIDTH;

interface SampleSpec {
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

function buildSampleResume(spec: SampleSpec): Resume {
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

const SAMPLES: { label: string; resume: Resume }[] = [
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

export default function OutputPreviewRow() {
  return (
    <section
      aria-label="Real output previews"
      className="mx-auto px-4 sm:px-8"
      style={{ maxWidth: 1280, paddingTop: 72, paddingBottom: 72 }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          The output you actually get
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Rendered with the same templates and preview engine you export from. Sample content
          shown; your resume uses your real experience.
        </p>
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLES.map(({ label, resume }) => (
          <figure key={resume.id} className="m-0 w-full" style={{ maxWidth: FRAME_WIDTH + 2 }}>
            <div
              className="relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
              style={{ height: FRAME_HEIGHT }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-0 origin-top"
                style={{
                  width: PREVIEW_PAGE_WIDTH,
                  transform: `translateX(-50%) scale(${SCALE})`,
                }}
                aria-hidden="true"
              >
                <ResumePreview resume={resume} templateId={resume.templateId} zoom={100} />
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
                style={{ background: 'linear-gradient(transparent, var(--muted))' }}
              />
            </div>
            <figcaption className="mt-3 text-center text-sm font-medium text-muted-foreground">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
