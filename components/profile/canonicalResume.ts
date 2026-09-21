import { ResumeData } from '../../types';

export const CANONICAL_RESUME_SLUG = 'moviegoer24@gmail.com-professional';

const latestResume = {
  title: 'Sam Yao — Senior Full-Stack Software Engineer',
  isHomepage: true,
  sectionOrder: ['profile', 'skills', 'work', 'education', 'projects', 'volunteer'],
  basics: {
    name_zh: '姚柏杨（Sam）',
    name_en: 'Baiyang Yao (Sam)',
    label_zh: '资深全栈软件工程师',
    label_en: 'Senior Full-Stack Software Engineer',
    email: 'moviegoer24@gmail.com',
    phone: '+64 27 450 0897',
    location_zh: '新西兰奥克兰',
    location_en: 'Auckland, New Zealand',
    website: 'samyao.me',
    linkedin: 'linkedin.com/in/samyao24',
    summary_zh:
      '全栈软件工程师，拥有五年以上在 Lalamove、腾讯云和美国科技初创公司构建面向客户的产品与开发者平台的经验。擅长 React、TypeScript、Node.js 和微服务系统，能够从产品需求、架构设计到生产支持全程负责技术交付。目前就读于奥克兰大学信息技术硕士，希望将这些经验带到新西兰的软件工程团队。',
    summary_en:
      'Full-stack software engineer with over five years of experience building customer-facing products and developer platforms at Lalamove, Tencent Cloud, and a US technology startup. Strong in React, TypeScript, Node.js, and microservice-based systems, with experience owning technical delivery from product requirements and architecture through production support. Currently completing a Master of Information Technology at the University of Auckland and looking to contribute this experience to a New Zealand software engineering team.'
  },
  skills: [
    {
      name_zh: '产品与交付',
      name_en: 'Product & Delivery',
      keywords: [
        'Technical ownership',
        'Feature refinement',
        'Requirement clarification',
        'Task decomposition',
        'Sprint coordination',
        'Cross-functional delivery'
      ]
    },
    {
      name_zh: '工程判断',
      name_en: 'Engineering Judgement',
      keywords: [
        'Technical feasibility & trade-offs',
        'Conversion & performance metrics',
        'UX consistency',
        'Internationalisation',
        'Incident response',
        '0-to-1 delivery'
      ]
    },
    {
      name_zh: '技术基础',
      name_en: 'Technical Foundation',
      keywords: [
        'React',
        'TypeScript',
        'Next.js',
        'Node.js',
        'Python',
        'REST APIs',
        'Microservices',
        'SQL',
        'MongoDB',
        'AWS',
        'GCP',
        'Docker',
        'CI/CD',
        'AI agents & LLM-assisted development'
      ]
    }
  ],
  work: [
    {
      company_zh: 'Lalamove 货拉拉',
      company_en: 'Lalamove Delivery',
      position_zh: '资深全栈工程师',
      position_en: 'Senior Full-Stack Engineer',
      location_zh: '深圳 / 香港',
      location_en: 'Shenzhen / Hong Kong',
      startDate: 'Jun 2021',
      endDate: 'Apr 2025',
      weight: 100,
      highlights_zh: [
        '担任多个司机产品的技术负责人，将产品需求转化为技术方案，拆分实施任务并协调多个 Sprint 的交付。',
        '使用 React、Next.js 和 Vite 主导司机 CRM 与增长系统前端架构，推动转化率提升 18%；并建设可复用的 RTL 组件体系，支持中东市场国际化。',
        '推动部分 PHP/Laravel 遗留服务迁移到 Node.js，并构建集成 Apollo Config、SkyWalking 和 Consul 的共享 SOA SDK，统一服务开发标准。',
        '负责处理针对司机注册的 SMS 话费欺诈，通过流量分析、IP 封禁与 hCaptcha 调优控制损失；长期方案 Odoko 统一 OTP/SMS 平台成为公司标准，避免超过 10,000 美元的通信滥用成本。'
      ],
      highlights_en: [
        'Acted as technical owner for several Driver products, translating product requirements into technical plans, breaking work into implementation tasks, and coordinating delivery across sprint cycles.',
        'Led frontend architecture for Driver CRM and Growth systems using React, Next.js, and Vite, contributing to an 18% increase in conversion rates. Led i18n readiness for overseas expansion, including a reusable Right-to-Left (RTL) component framework for Middle Eastern markets.',
        "Drove the migration of selected legacy PHP/Laravel backend services to Node.js to better align the backend stack with the team's JavaScript expertise. Built the shared Node.js SOA SDK integrating Apollo Config, SkyWalking tracing, and Consul service discovery.",
        'Led incident response to active SMS toll fraud targeting legacy driver registration. Took ownership of Odoko, a unified OTP/SMS platform, and drove its rollout as the company-wide standard, avoiding an estimated $10,000+ in telecom abuse costs.'
      ]
    },
    {
      company_zh: '腾讯云',
      company_en: 'Tencent Cloud',
      position_zh: '软件工程师',
      position_en: 'Software Engineer',
      location_zh: '中国深圳',
      location_en: 'Shenzhen, China',
      startDate: 'Apr 2020',
      endDate: 'Jun 2021',
      weight: 90,
      highlights_zh: [
        '开发 CODING DevOps 平台的 CI/CD、代码分析与自动化测试核心 React 模块，帮助企业用户将平均构建时间降低 40%。',
        '维护并优化自研微前端架构，子系统加载速度提升约 50%，独立部署使发布频率提升 300%。',
        '基于 Ant Design 建设内部 React 组件库，统一 CI/CD 产品线体验并将前端交付效率提升 30%。'
      ],
      highlights_en: [
        'Developed core React modules for the CODING DevOps platform, including CI/CD, Code Analysis, and Automation Testing workflows, helping reduce average build times by 40% for enterprise users.',
        'Maintained and optimised a proprietary micro-frontend architecture, improving child-system loading speed by about 50% and enabling independent deployments that increased release frequency by 300%.',
        'Built and maintained an internal React component library based on Ant Design, standardising UX/UI across the CI/CD product line and improving frontend delivery efficiency by 30%.'
      ]
    },
    {
      company_zh: 'BeeHex 3D 打印',
      company_en: 'BeeHex 3D Print',
      position_zh: '软件工程师实习生',
      position_en: 'Software Engineer Intern',
      location_zh: '美国俄亥俄州哥伦布',
      location_en: 'Columbus, Ohio, USA',
      startDate: 'May 2019',
      endDate: 'Sep 2019',
      weight: 80,
      highlights_zh: [
        '使用 React、Redux 与 TypeScript 构建 3D 食品打印电商平台，帮助公司上线首个直面消费者的数字订购渠道。',
        '参与 3D 蛋糕打印机触屏 UI/UX，并使用 Next.js 服务端渲染开发社区门户以提升自然搜索曝光。'
      ],
      highlights_en: [
        "Built the company's 3D food-printing e-commerce platform using React, Redux, and TypeScript, enabling its first direct-to-consumer digital ordering channel.",
        'Collaborated on UI/UX implementation for the 3D Cake Printer touchscreen and developed a Next.js community portal using server-side rendering to improve organic search visibility.'
      ]
    },
    {
      company_zh: 'Orion — 从 0 到 1 的个人平台',
      company_en: 'The Orion — 0-to-1 Personal Platform',
      position_zh: 'React / TypeScript / Node.js / MongoDB / Firebase / Cloudflare / GCP',
      position_en: 'React / TypeScript / Node.js / MongoDB / Firebase / Cloudflare / GCP',
      location_zh: 'samyao.me',
      location_en: 'samyao.me',
      startDate: 'Apr 2025',
      endDate: 'Present',
      weight: 100,
      isProject: true,
      highlights_zh: [
        '从 0 到 1 定义、构建并上线真实平台；使用 AI Agent 加速规划、实现、重构和调试，同时持续负责架构、代码审查、集成与生产验证。',
        '将认证、RBAC、媒体存储、事务邮件、审计日志与 SEO 预渲染整合为一个由托管云服务和自定义应用逻辑组成的完整产品。'
      ],
      highlights_en: [
        'Scoped, built, and launched a live platform from 0 to 1, using AI agents to accelerate planning, implementation, refactoring, and debugging while retaining ownership of architecture, code review, integrations, and production validation.',
        'Combined authentication, RBAC, media storage, transactional email, audit logging, and SEO pre-rendering into a coherent end-to-end product using managed cloud services and custom application logic.'
      ]
    }
  ],
  education: [
    {
      institution: 'University of Auckland',
      location: 'Auckland, New Zealand',
      studyType_zh: '信息技术硕士',
      studyType_en: 'Master of Information Technology',
      area_zh: '软件、云、网络与数字系统',
      area_en: 'Software, cloud, networking, and digital systems',
      startDate: 'Jul 2026',
      endDate: 'Nov 2027',
      score_zh: '在读',
      score_en: 'Current postgraduate study'
    },
    {
      institution: 'Miami University',
      location: 'Ohio, USA',
      studyType_zh: '互动媒体文学学士',
      studyType_en: 'Bachelor of Arts in Interactive Media',
      startDate: 'Aug 2015',
      endDate: 'May 2019',
      score_zh: '院长荣誉名单',
      score_en: "Dean's List Honor"
    }
  ],
  volunteer: [
    {
      organization_zh: '奥克兰大学 COMPSCI 734',
      organization_en: 'COMPSCI 734, University of Auckland',
      position_zh: '班级代表',
      position_en: 'Class Representative',
      startDate: 'Jul 2026',
      endDate: 'Nov 2026',
      highlights_zh: ['代表学生反馈，并在学生与教学团队之间沟通问题、意见和解决方案。'],
      highlights_en: [
        'Represent student concerns and communicate issues, feedback, and resolutions between students and the teaching team.'
      ]
    },
    {
      organization_zh: 'APRU 全球可持续发展：Waste & The City 2026',
      organization_en: 'APRU Global Sustainability: Waste & The City 2026',
      position_zh: '奥克兰大学代表',
      position_en: 'University of Auckland Representative',
      startDate: 'Sep 2026',
      endDate: 'Nov 2026',
      highlights_zh: ['作为奥克兰大学代表参加探索城市废弃物与可持续发展挑战的线上项目。'],
      highlights_en: [
        'Participate as a University of Auckland representative in the virtual programme exploring urban waste and sustainability challenges.'
      ]
    },
    {
      organization_zh: 'AWS Agentic Football 奥克兰工作坊',
      organization_en: 'AWS Agentic Football — Auckland Workshop',
      position_zh: '第一名',
      position_en: '1st Place',
      startDate: 'Aug 2026',
      endDate: 'Aug 2026',
      highlights_zh: ['构建并部署 AI Agent 足球队，在奥克兰工作坊获得第一名。'],
      highlights_en: [
        'Built and deployed an AI-agent football team, finishing first in the Auckland workshop competition.'
      ]
    }
  ],
  interest: [],
  languages: [],
  styleSettings: {
    fontSize: 'small',
    lineHeight: 'compact',
    themeColor: 'slate',
    margin: 'small',
    sectionGap: 'compact',
    pdfMode: 'single-page',
    paperSize: 'a4'
  },
  pageLimit: 1,
  sectionTitles: {
    profile_zh: '个人简介',
    profile_en: 'Profile',
    skills_zh: '产品与技术能力',
    skills_en: 'Product & Technical Capabilities',
    work_zh: '工作经历',
    work_en: 'Experience',
    education_zh: '教育经历',
    education_en: 'Education',
    projects_zh: '精选工程项目',
    projects_en: 'Selected Engineering Project',
    volunteer_zh: '领导力与活动',
    volunteer_en: 'Leadership & Activities'
  }
} satisfies Omit<ResumeData, '_id'>;

export const withCanonicalSamResume = (resume: ResumeData, slug?: string): ResumeData => {
  if (slug !== CANONICAL_RESUME_SLUG) return resume;
  return { ...resume, ...latestResume, _id: resume._id, slug: CANONICAL_RESUME_SLUG };
};
