import { JobDescription } from '@shared/types';

export const PRESET_JOBS: JobDescription[] = [
  {
    id: 'full-stack-dev',
    title: 'Full-Stack Developer',
    description: `We're looking for a Full-Stack Developer to join our team. You'll work with modern web technologies including React, Node.js, and databases. Responsibilities include building scalable applications, writing clean code, and collaborating with designers and product managers.

Key Requirements:
- 3+ years of web development experience
- Proficiency in JavaScript/TypeScript
- Experience with React or similar frameworks
- Backend development experience (Node.js, Python, or similar)
- Database design and SQL knowledge
- Git and version control
- RESTful API design
- Problem-solving and communication skills`,
    keywords: [
      'React',
      'Node.js',
      'JavaScript',
      'TypeScript',
      'Full-Stack',
      'REST API',
      'Database',
      'Git',
      'Agile',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'frontend-eng',
    title: 'Frontend Engineer',
    description: `Join our Frontend team to build beautiful, responsive user interfaces. We use React, TypeScript, and modern CSS. You'll collaborate with designers, backend engineers, and product teams to create exceptional user experiences.

Key Requirements:
- 2+ years of frontend development
- Strong JavaScript/TypeScript skills
- React or Vue.js experience
- CSS and responsive design
- HTML5 and semantic markup
- Browser DevTools proficiency
- Performance optimization
- Accessibility (a11y) knowledge`,
    keywords: [
      'React',
      'Frontend',
      'JavaScript',
      'TypeScript',
      'CSS',
      'HTML5',
      'Responsive Design',
      'UI/UX',
      'Performance',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'backend-eng',
    title: 'Backend Engineer',
    description: `We're seeking a Backend Engineer to design and build scalable server-side applications. You'll work with microservices, databases, and cloud infrastructure to power our platform.

Key Requirements:
- 3+ years of backend development
- Proficiency in Python, Java, Go, or Node.js
- Database design (SQL and NoSQL)
- API design and development
- Microservices architecture
- Cloud platforms (AWS, GCP, Azure)
- Docker and containerization
- System design and scalability`,
    keywords: [
      'Backend',
      'Python',
      'Java',
      'Node.js',
      'Database',
      'SQL',
      'API',
      'Microservices',
      'Cloud',
      'Docker',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'devops-eng',
    title: 'DevOps Engineer',
    description: `Help us build and maintain our infrastructure and deployment pipelines. You'll work with cloud platforms, containerization, and automation to ensure reliable, scalable systems.

Key Requirements:
- 2+ years of DevOps experience
- Cloud platform expertise (AWS, GCP, or Azure)
- Docker and Kubernetes
- CI/CD pipeline design
- Infrastructure as Code (Terraform, CloudFormation)
- Linux/Unix administration
- Monitoring and logging
- Security best practices`,
    keywords: [
      'DevOps',
      'AWS',
      'Docker',
      'Kubernetes',
      'CI/CD',
      'Terraform',
      'Linux',
      'Cloud',
      'Infrastructure',
      'Automation',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: `Join our Data Science team to build machine learning models and derive insights from data. You'll work with large datasets, develop algorithms, and collaborate with engineers to deploy models.

Key Requirements:
- 2+ years of data science experience
- Python and R proficiency
- Machine learning frameworks (TensorFlow, scikit-learn)
- Statistical analysis and mathematics
- SQL and database knowledge
- Data visualization
- Model evaluation and validation
- Communication of technical concepts`,
    keywords: [
      'Data Science',
      'Python',
      'Machine Learning',
      'TensorFlow',
      'SQL',
      'Statistics',
      'Data Analysis',
      'R',
      'Deep Learning',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description: `Lead product strategy and development as a Product Manager. You'll define product vision, prioritize features, and work cross-functionally with engineering, design, and marketing.

Key Requirements:
- 3+ years of product management
- Product strategy and roadmap experience
- Data-driven decision making
- User research and empathy
- Stakeholder management
- Agile/Scrum experience
- Communication and leadership
- Technical understanding`,
    keywords: [
      'Product Manager',
      'Product Strategy',
      'Roadmap',
      'User Research',
      'Analytics',
      'Agile',
      'Leadership',
      'Communication',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    description: `Create beautiful and intuitive user experiences as a UI/UX Designer. You'll conduct user research, create wireframes and prototypes, and collaborate with developers to bring designs to life.

Key Requirements:
- 2+ years of UI/UX design experience
- Figma or similar design tools
- User research and testing
- Wireframing and prototyping
- Design systems knowledge
- Accessibility principles
- Collaboration skills
- Portfolio of design work`,
    keywords: [
      'UI/UX Design',
      'Figma',
      'User Research',
      'Prototyping',
      'Design Systems',
      'Accessibility',
      'Interaction Design',
      'Visual Design',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'qa-engineer',
    title: 'QA Engineer',
    description: `Ensure product quality as a QA Engineer. You'll design test cases, execute tests, report bugs, and work with developers to improve product reliability.

Key Requirements:
- 2+ years of QA experience
- Test case design and execution
- Automated testing frameworks
- Bug tracking and reporting
- API testing
- Performance testing
- Attention to detail
- Communication skills`,
    keywords: [
      'QA',
      'Testing',
      'Automation',
      'Selenium',
      'Bug Tracking',
      'Test Cases',
      'Performance Testing',
      'Quality Assurance',
    ],
    isCustom: false,
    createdAt: new Date(),
  },
];

export function getPresetJobs(): JobDescription[] {
  return PRESET_JOBS;
}

export function getJobById(id: string): JobDescription | undefined {
  return PRESET_JOBS.find((job) => job.id === id);
}

/** Match a preset target job from parsed resume job title / target role */
export function matchPresetJobByTitle(jobTitle?: string, targetRole?: string): string {
  const combined = `${jobTitle || ""} ${targetRole || ""}`.toLowerCase().trim();
  if (!combined) return "";

  const rules: { id: string; patterns: RegExp[] }[] = [
    { id: "full-stack-dev", patterns: [/full[\s-]?stack/, /fullstack/] },
    { id: "frontend-eng", patterns: [/front[\s-]?end/, /ui developer/, /react developer/] },
    { id: "backend-eng", patterns: [/back[\s-]?end/, /server[\s-]?side/] },
    { id: "devops-eng", patterns: [/devops/, /site reliability/, /\bsre\b/, /infrastructure engineer/] },
    { id: "data-scientist", patterns: [/data scien/, /machine learning/, /\bml engineer/] },
    { id: "product-manager", patterns: [/product manager/, /product owner/] },
    { id: "ui-ux-designer", patterns: [/ui[\s\/]?ux/, /ux designer/, /product designer/] },
    { id: "qa-engineer", patterns: [/\bqa\b/, /quality assurance/, /test engineer/] },
  ];

  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(combined))) {
      return rule.id;
    }
  }

  let bestId = "";
  let bestScore = 0;
  for (const job of PRESET_JOBS) {
    const titleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const score = titleWords.filter((w) => combined.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = job.id;
    }
  }
  return bestScore >= 1 ? bestId : "";
}

export function extractKeywords(description: string): string[] {
  // Simple keyword extraction - in production, use NLP
  const keywords: string[] = [];
  const words = description.toLowerCase().split(/\s+/);

  // Common tech keywords
  const techKeywords = [
    'react',
    'node.js',
    'python',
    'javascript',
    'typescript',
    'java',
    'go',
    'rust',
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'sql',
    'nosql',
    'mongodb',
    'postgresql',
    'api',
    'rest',
    'graphql',
    'microservices',
    'agile',
    'scrum',
    'git',
    'ci/cd',
    'devops',
    'machine learning',
    'ai',
    'data science',
    'figma',
    'ui/ux',
    'testing',
    'selenium',
  ];

  for (const word of words) {
    if (techKeywords.includes(word) && !keywords.includes(word)) {
      keywords.push(word);
    }
  }

  return keywords;
}
