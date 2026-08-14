import type { ResumeTemplate } from '@shared/types';

const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic-ats-blue',
    name: 'Classic ATS Blue',
    description: 'Single-column, ATS-friendly layout with blue accents',
    preview: '/templates/classic-ats-blue.png',
    styles: {
      colors: {
        primary: '#1e40af',
        secondary: '#bfdbfe',
        accent: '#2563eb',
        background: '#ffffff',
        text: '#1e293b',
        border: '#cbd5e1',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'single-column',
      spacing: 'normal',
      cornerRadius: 0,
    },
  },
];

export function getDefaultTemplate(): ResumeTemplate {
  return TEMPLATES[0];
}
