import { TechStackItem, Project, ExpertiseArea, SocialLink } from './types';
import { Code2, Server, Database, Cloud, Palette, FileCode, Linkedin, Github, Mail, Twitter, MonitorSmartphone, Webhook, Construction, Rocket, Cog, Lightbulb, ShieldCheck, Users } from 'lucide-react';
import uepLogo from './assets/uep.png'
import anandaLogo from './assets/ananda_logo.svg'
import zipgridLogo from './assets/zgimg.png'
import strikieLogo from './assets/strikie_logo.png'
import qubisense from './assets/qubisense.png'
import eyaLogo from './assets/eya.jpg'
import taxifyLogo from './assets/taxify-logo-png.png'
import fbpLogo from './assets/fbplogo.png'
import giftoizLogo from './assets/gz.png'

export const techStack: TechStackItem[] = [
  { id: 'nodejs', name: 'Node.js', Icon: Server, description: 'Event-driven, non-blocking I/O runtime for scalable server-side applications.', color: 'text-green-500' },
  { id: 'expressjs', name: 'Express.js', Icon: Webhook, description: 'Minimalist and flexible Node.js web application framework for building APIs and web apps.', color: 'text-gray-500 dark:text-gray-300' },
  { id: 'mysql', name: 'MySQL', Icon: Database, description: 'Popular open-source relational database management system.', color: 'text-blue-600' },
  { id: 'mongodb', name: 'MongoDB', Icon: Database, description: 'Popular open-source document-oriented database management system.', color: 'text-green-600' },
  { id: 'gcp', name: 'Google Cloud', Icon: Cloud, description: 'Suite of cloud computing services offered by Google.', color: 'text-sky-500' },
  { id: 'aws', name: 'AWS', Icon: Cloud, description: 'Suite of cloud computing services offered by Amazon', color: 'text-brown-500' },
  { id: 'react', name: 'React.js', Icon: Code2, description: 'JavaScript library for building user interfaces or UI components.', color: 'text-cyan-400' },
  { id: 'typescript', name: 'TypeScript', Icon: Code2, description: 'Typed superset of JavaScript that compiles to plain JavaScript.', color: 'text-yellow-500blue-500' },
  { id: 'html', name: 'HTML5', Icon: FileCode, description: 'Standard markup language for creating web pages and web applications.', color: 'text-orange-500' },
  { id: 'css', name: 'CSS3', Icon: Palette, description: 'Style sheet language used for describing the presentation of a document written in HTML.', color: 'text-blue-500' },
];

export const companyProjects: Project[] = [
  {
    id: 'comp-proj-1',
    name: 'UEP Viewer',
    logoUrl: uepLogo,
    description: 'Image viewer application with support for various image formats and user can also download images.',
    technologies: ['Node.js', 'MySQL', 'GCP'],
    background: "bg-gray-500",
    size: "w-46 h-16"
  },
  {
    id: 'comp-proj-2',
    name: 'Ananda Spa',
    logoUrl: anandaLogo,
    description: 'A spa and wellness center website with booking and service management features.',
    technologies: ['Node.js', 'MySQL', 'GCP'],
    background: "bg-gray-200",
    size: "w-46 h-16"
  },
  {
    id: 'comp-proj-3',
    name: 'ZipGrid',
    logoUrl: zipgridLogo,
    description: 'A society management platform with features for event management, member communication, and document sharing.',
    technologies: ['Node.js', 'MySQL', 'GCP', 'PubSub', 'Datastore', 'Microservices'],
    background: "bg-gray-200",
    size: "w-30 h-10"
  },
  {
    id: 'comp-proj-4',
    name: 'Strikie',
    logoUrl: strikieLogo,
    description: 'A platform for managing and tracking sports events, teams, and players.',
    technologies: ['Node.js', 'Mysql', 'GCP'],
    background: "bg-gray-500",
    size: "w-46 h-18"
  },
  {
    id: 'comp-proj-5',
    name: 'SmartAxiom - Qubisense',
    logoUrl: qubisense,
    description: 'An admin panel for a tracking device that allows users to track shipments and monitor parameters such as temperature, humidity, orientation, and other environmental data.',
    technologies: ['Node.js', 'Socket.io', 'MySQL', 'microservices', 'MongoDB', 'GCP'],
    background: "bg-gray-200",
    size: "w-46 h-16"
  },
  {
    id: 'comp-proj-6',
    name: 'Eya Solar calculator',
    logoUrl: eyaLogo,
    description: 'A small static solar plate charges calculator website made with the help of vibe coding.',
    technologies: ['React.js', 'Vibecoding', 'Firebase'],
    background: "bg-gray-200",
    size: "w-full h-full",
    link: "https://eya-solar-calculator-316.web.app/"
  },
];

export const personalProjects: Project[] = [
  {
    id: 'pers-proj-1',
    name: 'Furniture By Panchal',
    logoUrl: fbpLogo,
    description: 'A tool to quickly generate modern developer portfolio websites based on user input. (This project!)',
    technologies: ['React', 'Vibecoding', 'TypeScript', 'Tailwind CSS', 'GCP'],
    background: "bg-gray-200",
    size: "w-46 h-16",
    link: 'https://furniture-by-panchal-by-bolt.vercel.app/'
  },
  {
    id: 'pers-proj-2',
    name: 'TaxiFy',
    logoUrl: taxifyLogo,
    background: "bg-gray-200",
    size: "w-42 h-20",
    description: 'A platform that provides users with information about tax benefits and tax slabs in India',
    technologies: ['TypeScript', 'Tailwind CSS', 'Vibecoding', 'Firebase'],
    link: 'https://taxify.co.in'
  },
  {
    id: 'pers-proj-3',
    name: 'ScrollWish',
    logoUrl: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/scrollwish%2F1771786731439_scrollWish-digital-greeting-cards.jpeg?alt=media&token=2cff6d2b-71b5-430b-8f8b-006a294d4a89',
    description: 'A digital greeting card website that allows users to customize cards based on their preferences. It offers multiple card categories such as wedding invitations, birthday cards, and many more.',
    technologies: ['TypeScript', 'Tailwind CSS', 'Vibecoding', 'Firebase'],
    additional_link_key: ['See our wedding invitations →', 'Magical birthday Wish →'],
    additional_link: ['https://www.scrollwish.com/editor/wedding-invite'],
    link: 'https://scrollwish.com'
  },
  {
    id: 'pers-proj-4',
    name: 'Giftoiz',
    logoUrl: giftoizLogo,
    description: 'We are Giftoiz, a creative brand specializing in personalized gifts that make every occasion special. From customized frames and handcrafted peg dolls to elegant wedding cards and more, we create thoughtful, one-of-a-kind pieces designed to bring joy and lasting memories. At Giftoiz, every gift tells a unique story made just for you.',
    technologies: ['TypeScript', 'Tailwind CSS', 'Vibecoding', 'Firebase'],
    link: 'https://giftoiz.com',
    background: "bg-gray-600",
    size: "w-46 h-32",
  },
];

export const expertiseAreas: ExpertiseArea[] = [
  {
    id: 'backend',
    title: 'Backend Development',
    Icon: Cog,
    description: 'Building scalable server-side applications and RESTful APIs using Node.js and Express.js. Proficient in database design and management with SQL & NoSQL solutions, ensuring robust and efficient data handling.',
    skills: ['Node.js', 'Express.js', 'MySQL', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Microservices', 'Authentication (JWT)']
  },
  {
    id: 'frontend',
    title: 'Frontend Development',
    Icon: MonitorSmartphone,
    description: 'Crafting responsive and interactive user interfaces with React, TypeScript, and modern CSS frameworks like Tailwind CSS. Focused on delivering intuitive and performant web experiences.',
    skills: ['React', 'TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Tailwind CSS', 'Responsive Design', 'State Management (Redux/Context API)']
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps',
    Icon: Construction, // Or Cloud / ShieldCheck if more appropriate
    description: 'Experience with cloud platforms like GCP and AWS for deploying and managing applications. Familiar with CI/CD pipelines, containerization (Docker), and infrastructure as code principles.',
    skills: ['GCP', 'AWS (EC2, S3)', 'Docker', 'Kubernetes (Basic)', 'CI/CD (Jenkins/GitHub Actions)', 'Git']
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving & Algorithms',
    Icon: Rocket, // Or Lightbulb / Users
    description: 'Strong analytical and problem-solving skills with a good understanding of data structures and algorithms. Passionate about tackling complex challenges and optimizing solutions for performance and scalability.',
    skills: ['Data Structures', 'Algorithms', 'System Design', 'Debugging', 'Performance Optimization']
  }
];

export const socialLinks: SocialLink[] = [
  { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/in/sharma-abhinay', Icon: Linkedin },
  { id: 'github', name: 'GitHub', url: 'https://github.com/abhinaysharma-devil', Icon: Github },
  { id: 'email', name: 'Email', url: 'mailto:panchalabhinay@gmail.com', Icon: Mail },
  // { id: 'twitter', name: 'Twitter', url: 'https://twitter.com/abhinaydev', Icon: Twitter },
];

export const fullName = "Abhinay Sharma";
export const designation = "Software Developer";
export const heroIntroLines = [
  "Crafting digital experiences...",
  "Building robust backends...",
  "And elegant frontends.",
  "Let's build something amazing together!"
];
