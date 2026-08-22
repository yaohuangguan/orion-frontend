/**
 * Script to create / update the public resume data directly to the backend API or MongoDB.
 * 
 * Usage:
 *   node scripts/seedPublicResume.js [api_url] [auth_token]
 * 
 * Or with direct MongoDB URI if configured in environment:
 *   MONGO_URI="mongodb+srv://..." node scripts/seedPublicResume.js
 */

export const publicResumePayload = {
  slug: 'moviegoer24@gmail.com-professional',
  title: 'Professional Resume',
  isHomepage: true,
  sectionOrder: ['profile', 'skills', 'work', 'education', 'projects', 'volunteer'],
  basics: {
    name_en: 'Baiyang Yao (Sam)',
    label_en: 'Full-Stack Software Engineer',
    email: 'moviegoer24@gmail.com',
    phone: '+64 27 450 0897',
    location_en: 'Auckland, New Zealand',
    visaStatus_en: '',
    summary_en:
      'Full-stack software engineer with over five years of experience building web products and developer platforms at Lalamove, Tencent Cloud, and a US technology startup. Strong in React, TypeScript, Node.js, and microservice-based systems, with experience owning features from architecture through delivery and production support. Previously a Senior Full-Stack Engineer at Lalamove and currently completing a Master of Information Technology at the University of Auckland.',
    website: 'samyao.me',
    linkedin: 'linkedin.com/in/samyao24'
  },
  skills: [
    {
      name_en: 'Frontend',
      keywords: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Vite', 'Redux', 'Tailwind CSS', 'Ant Design']
    },
    {
      name_en: 'Backend & Data',
      keywords: ['Node.js', 'Koa.js', 'Express', 'REST APIs', 'Microservices', 'SQL/MySQL', 'MongoDB', 'Redis']
    },
    {
      name_en: 'Cloud & DevOps',
      keywords: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'Kafka', 'Nginx', 'Vercel', 'Cloudflare', 'CI/CD']
    },
    {
      name_en: 'Mobile & Architecture',
      keywords: ['Flutter', 'Micro-frontends', 'SSR', 'i18n/RTL', 'RBAC', 'OAuth/JWK']
    }
  ],
  work: [
    {
      company_en: 'Lalamove Delivery',
      position_en: 'Senior Full-Stack Engineer II',
      location_en: 'Shenzhen / Hong Kong',
      startDate: 'Jun 2021',
      endDate: 'Apr 2025',
      weight: 400,
      isProject: false,
      highlights_en: [
        'Served as Product Tech Owner (PIC) for the Hong Kong Driver Full-Stack Team, leading feature refinement, task decomposition, technical coordination, and delivery in a fully English-speaking environment.',
        'Led frontend architecture for Driver CRM and Growth systems using React, Next.js, and Vite, contributing to an 18% increase in conversion rates. Led i18n readiness for overseas expansion, including a reusable Right-to-Left (RTL) component framework for Middle Eastern markets.',
        'Helped pioneer the adoption of Node.js for backend services and built the core Node.js SOA SDK, integrating Apollo Config, SkyWalking tracing, and Consul service discovery to standardise microservice development.',
        'Led incident response to active SMS toll fraud on legacy driver registration. Contained losses through traffic analysis, IP blocking, and hCaptcha tuning, then took overall ownership of Odoko - a unified OTP/SMS platform I had helped develop - and scaled it into a company-wide solution, preventing more than $10,000 in potential telecom abuse costs.'
      ]
    },
    {
      company_en: 'Tencent Cloud',
      position_en: 'Software Engineer',
      location_en: 'Shenzhen, China',
      startDate: 'Apr 2020',
      endDate: 'Jun 2021',
      weight: 300,
      isProject: false,
      highlights_en: [
        'Developed core React modules for the CODING DevOps platform, including CI/CD, Code Analysis, and Automation Testing workflows, helping reduce average build times by 40% for enterprise users.',
        'Maintained and optimised a proprietary micro-frontend architecture, improving child-system loading speed by about 50% and enabling independent deployments that increased release frequency by 300%.',
        'Built and maintained an internal React component library based on Ant Design, standardising UX/UI across the CI/CD product line and improving frontend delivery efficiency by 30%.'
      ]
    },
    {
      company_en: 'BeeHex 3D Print',
      position_en: 'Software Engineer Intern',
      location_en: 'Columbus, Ohio, USA',
      startDate: 'May 2019',
      endDate: 'Sep 2019',
      weight: 200,
      isProject: false,
      highlights_en: [
        "Built the company's 3D food-printing e-commerce platform using React, Redux, and TypeScript, enabling its first direct-to-consumer digital ordering channel.",
        'Collaborated on UI/UX implementation for the 3D Cake Printer touchscreen and developed a Next.js community portal using server-side rendering to improve organic search visibility.'
      ]
    },
    {
      company_en: 'The Orion - Personal Website & Portfolio',
      position_en: 'React / TypeScript / Node.js / MongoDB / GCP / Cloudflare / Vercel',
      location_en: 'samyao.me',
      startDate: 'Apr 2025',
      endDate: 'Present',
      weight: 100,
      isProject: true,
      highlights_en: [
        'Built and deployed a responsive full-stack web application using React, TypeScript, Tailwind CSS, Node.js/Express, and MongoDB, with Cloudflare R2 for media management and Vercel/GCP for deployment.',
        'Implemented role-based access control, request logging and audit trails, plus a concurrent Node.js/Puppeteer pre-rendering workflow to make Vite SPA content SEO-friendly.'
      ]
    }
  ],
  education: [
    {
      institution: 'University of Auckland',
      location: 'Auckland, New Zealand',
      studyType_en: 'Master of Information Technology',
      area_en: 'Current postgraduate study focused on software, cloud, networking, and digital systems.',
      startDate: 'Jul 2026',
      endDate: 'Nov 2027'
    },
    {
      institution: 'Miami University',
      location: 'Ohio, USA',
      studyType_en: 'Bachelor of Arts in Interactive Media',
      startDate: 'Aug 2015',
      endDate: 'May 2019',
      score_en: "Dean's List Honor"
    }
  ],
  volunteer: [
    {
      organization_en: 'University of Auckland',
      position_en: 'Class Representative - COMPSCI 734',
      startDate: 'Jul 2026',
      endDate: 'Nov 2026',
      highlights_en: [
        'Represent student concerns and help communicate issues, feedback, and resolutions between students and the teaching team.'
      ]
    },
    {
      organization_en: 'AWS',
      position_en: 'AWS Agentic Football Cup - Winning Team',
      startDate: '2026',
      endDate: '',
      highlights_en: [
        'Built and deployed an AI-agent football team during an AWS technical workshop and finished first in the live competition.'
      ]
    }
  ],
  interest: [],
  languages: [],
  styleSettings: {
    fontSize: 'normal',
    lineHeight: 'normal',
    themeColor: 'slate',
    margin: 'normal',
    sectionGap: 'compact',
    pdfMode: 'single-page',
    paperSize: 'a4'
  },
  pageLimit: 0,
  sectionTitles: {
    profile_en: 'Profile',
    skills_en: 'Skills',
    work_en: 'Experience',
    education_en: 'Education',
    projects_en: 'Selected Project',
    volunteer_en: 'Leadership & Activities'
  }
};

async function execute() {
  const targetApi = process.argv[2] || process.env.VITE_API_URL || 'https://bananaboom-api-242273127238.asia-east1.run.app/api';
  const token = process.argv[3] || process.env.AUTH_TOKEN;

  console.log(`🚀 Syncing Public Resume to Backend...`);
  console.log(`- Target Slug: ${publicResumePayload.slug}`);
  console.log(`- Target API: ${targetApi}/resumes?user=${publicResumePayload.slug}`);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['x-auth-token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${targetApi}/resumes?user=${publicResumePayload.slug}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(publicResumePayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errText}`);
    }

    const result = await response.json();
    console.log('✅ Successfully synced resume to backend!');
    console.log(JSON.stringify({
      slug: result.slug,
      title: result.title,
      isHomepage: result.isHomepage,
      workCount: result.work?.length,
      educationCount: result.education?.length
    }, null, 2));
  } catch (e) {
    console.error('❌ Error executing sync script:', e.message);
    console.log('\nTip: If authentication is required for direct API calls, run:');
    console.log('  node scripts/seedPublicResume.js [api_base_url] [auth_token]');
    console.log('Or run the backend MongoDB script in new-bananaboom-api-2025:');
    console.log('  node --env-file=.env scripts/upsertProfessionalResume.js --apply --confirm=moviegoer24@gmail.com-professional');
  }
}

if (process.argv[1]?.endsWith('seedPublicResume.js')) {
  execute();
}
