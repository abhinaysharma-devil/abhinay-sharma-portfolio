import { Server, Database, Globe, Code, Cpu, Cloud } from 'lucide-react';

export const expertiseAreas = [
  {
    title: 'Backend Development',
    description: 'Building scalable server-side applications and RESTful APIs with robust architecture.',
    icon: Server,
    skills: ['Node.js', 'Express.js', 'MySQL', 'REST APIs', 'Microservices']
  },
  {
    title: 'Database Design',
    description: 'Designing and optimizing database schemas for performance and scalability.',
    icon: Database,
    skills: ['MySQL', 'NoSQL', 'Database Optimization', 'Data Modeling', 'Query Performance']
  },
  {
    title: 'Web Development',
    description: 'Creating responsive and interactive web applications with modern technologies.',
    icon: Globe,
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design']
  },
  {
    title: 'API Development',
    description: 'Designing and implementing robust RESTful and GraphQL APIs with proper documentation.',
    icon: Code,
    skills: ['REST', 'API Gateway', 'Swagger', 'Authentication', 'Rate Limiting']
  },
  {
    title: 'System Architecture',
    description: 'Designing scalable and maintainable system architectures for complex applications.',
    icon: Cpu,
    skills: ['Microservices', 'Event-Driven Architecture', 'System Design', 'Scalability']
  },
  {
    title: 'Cloud Services',
    description: 'Deploying and managing applications on cloud platforms with DevOps best practices.',
    icon: Cloud,
    skills: ['GCP', 'AWS', 'Docker', 'CI/CD', 'Cloud Monitoring']
  }
];