import type { ResumeTemplate, TemplateId } from '@shared/types';

export const TEMPLATES: ResumeTemplate[] = [
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
  {
    id: 'minimal-executive',
    name: 'Minimal Executive',
    description: 'Clean minimalist design with emerald accents',
    preview: '/templates/minimal-executive.png',
    styles: {
      colors: {
        primary: '#047857',
        secondary: '#a7f3d0',
        accent: '#10b981',
        background: '#ffffff',
        text: '#1e293b',
        border: '#cbd5e1',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'single-column',
      spacing: 'spacious',
      cornerRadius: 0,
    },
  },
  {
    id: 'modern-sidebar-lite',
    name: 'Modern Sidebar Lite',
    description: 'Two-column with sidebar for skills and contact',
    preview: '/templates/modern-sidebar-lite.png',
    styles: {
      colors: {
        primary: '#334155',
        secondary: '#e2e8f0',
        accent: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        border: '#cbd5e1',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'sidebar',
      spacing: 'normal',
      cornerRadius: 0,
    },
  },
  {
    id: 'technical-compact',
    name: 'Technical Compact',
    description: 'Compact layout optimized for dense technical content',
    preview: '/templates/technical-compact.png',
    styles: {
      colors: {
        primary: '#6d28d9',
        secondary: '#ddd6fe',
        accent: '#8b5cf6',
        background: '#ffffff',
        text: '#1e293b',
        border: '#cbd5e1',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'single-column',
      spacing: 'compact',
      cornerRadius: 0,
    },
  },
  {
    id: 'crystalline-professional',
    name: 'Crystalline Professional',
    description: 'Dark mode resume with crystalline blue tones and orange accents',
    preview: '/templates/crystalline-professional.png',
    styles: {
      colors: {
        primary: '#1e40af',
        secondary: '#b8c4ff',
        accent: '#ea580c',
        background: '#0b1326',
        text: '#dae2fd',
        border: '#444653',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: 'single-column',
      spacing: 'normal',
      cornerRadius: 8,
    },
  },
];

export function getTemplateById(id: string): ResumeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): ResumeTemplate {
  return TEMPLATES[0];
}
