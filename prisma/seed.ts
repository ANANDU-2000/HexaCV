import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create an admin user
  const adminUser = await prisma.user.upsert({
    where: { openId: 'admin-key-owner' },
    update: {},
    create: {
      openId: 'admin-key-owner',
      name: 'Surag (Founder)',
      email: 'surag@hexastacksolutions.com',
      role: 'ADMIN',
      loginMethod: 'oauth',
    },
  });

  console.log(`Seeded admin user: ${adminUser.name}`);

  // Create preset job descriptions
  const presets = [
    {
      title: 'Full-Stack Developer',
      description: 'Experience in React 19, Node.js, Express, PostgreSQL, and Redis.',
      keywords: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Redis', 'TypeScript'],
      isCustom: false,
    },
    {
      title: 'Frontend Engineer',
      description: 'Experience in React, Tailwind CSS, TypeScript, and responsive design.',
      keywords: ['React', 'Tailwind CSS', 'TypeScript', 'Responsive Design', 'Vite'],
      isCustom: false,
    },
    {
      title: 'Backend Engineer',
      description: 'Experience in Node.js, Express, databases, APIs, and microservices.',
      keywords: ['Node.js', 'Express', 'API', 'Database', 'Microservices', 'PostgreSQL'],
      isCustom: false,
    },
  ];

  for (const preset of presets) {
    const record = await prisma.jobDescription.create({
      data: {
        title: preset.title,
        description: preset.description,
        keywords: JSON.stringify(preset.keywords),
        isCustom: false,
      },
    });
    console.log(`Seeded preset job description: ${record.title}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
