import type { ResumeTemplate } from '@shared/types';

/**
 * Single template — no template selection UI.
 * `classic-ats-blue` is auto-applied to every resume.
 */
const DEFAULT_TEMPLATE: ResumeTemplate = {
  id: 'classic-ats-blue',
  name: 'Classic ATS Blue',
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
};

export function getDefaultTemplate(): ResumeTemplate {
  return DEFAULT_TEMPLATE;
}
