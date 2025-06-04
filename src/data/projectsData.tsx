import React from 'react';
import { ShoppingCart, BarChart, FileText, Server, Database, Users, MessageSquare, Layout } from 'lucide-react';

export const companyProjects = [
  {
    id: 1,
    name: 'E-Commerce Platform',
    description: 'A scalable e-commerce solution with integrated payment processing and inventory management.',
    logo: <ShoppingCart size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Express.js', 'MySQL', 'React'],
    link: 'https://example.com/e-commerce'
  },
  {
    id: 2,
    name: 'Analytics Dashboard',
    description: 'Real-time analytics dashboard for tracking business metrics and visualizing data trends.',
    logo: <BarChart size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'D3.js', 'MySQL', 'Express.js'],
    link: 'https://example.com/analytics'
  },
  {
    id: 3,
    name: 'Content Management System',
    description: 'Custom CMS for enterprise clients with workflow management and publishing controls.',
    logo: <FileText size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Express.js', 'MySQL', 'React'],
    link: 'https://example.com/cms'
  },
  {
    id: 4,
    name: 'API Gateway Service',
    description: 'Centralized API gateway for managing microservices and handling authentication.',
    logo: <Server size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Express.js', 'GCP', 'Redis'],
    link: 'https://example.com/api-gateway'
  },
  {
    id: 5,
    name: 'Data Pipeline System',
    description: 'ETL pipeline for processing and transforming large datasets in real-time.',
    logo: <Database size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'MySQL', 'Kafka', 'GCP'],
    link: 'https://example.com/data-pipeline'
  },
  {
    id: 6,
    name: 'HR Management Platform',
    description: 'Comprehensive HR solution for employee management, onboarding, and performance tracking.',
    logo: <Users size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Express.js', 'MySQL', 'React'],
    link: 'https://example.com/hr-platform'
  }
];

export const personalProjects = [
  {
    id: 1,
    name: 'Chat Application',
    description: 'Real-time chat application with private and group messaging capabilities.',
    logo: <MessageSquare size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Socket.io', 'Express.js', 'MongoDB'],
    link: 'https://github.com/abhinay-sharma/chat-app'
  },
  {
    id: 2,
    name: 'Personal Blog',
    description: 'A markdown-based blog with syntax highlighting and responsive design.',
    logo: <FileText size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['Node.js', 'Express.js', 'React', 'Markdown'],
    link: 'https://github.com/abhinay-sharma/blog'
  },
  {
    id: 3,
    name: 'Portfolio Template',
    description: 'Customizable portfolio template for developers to showcase their work.',
    logo: <Layout size={64} className="text-teal-600 dark:text-teal-400" />,
    technologies: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    link: 'https://github.com/abhinay-sharma/portfolio-template'
  }
];