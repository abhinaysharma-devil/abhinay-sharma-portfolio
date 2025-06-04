import React from 'react';
import { Server, Database, Code, FileJson, Cpu, Cloud } from 'lucide-react';

// We're using Lucide React icons as placeholders
// In a real app, you might want to use actual logos
export const techLogos = [
  {
    name: 'Node.js',
    icon: Server,
    description: 'JavaScript runtime for server-side applications with event-driven, non-blocking I/O architecture.'
  },
  {
    name: 'Express.js',
    icon: FileJson,
    description: 'Fast, unopinionated, minimalist web framework for Node.js to build robust APIs and web applications.'
  },
  {
    name: 'MySQL',
    icon: Database,
    description: 'Relational database management system for structured data storage and complex queries.'
  },
  {
    name: 'HTML',
    icon: Code,
    description: 'Standard markup language for documents designed to be displayed in a web browser.'
  },
  {
    name: 'CSS',
    icon: Code,
    description: 'Style sheet language used for describing the presentation of a document written in HTML.'
  },
  {
    name: 'GCP',
    icon: Cloud,
    description: 'Google Cloud Platform for deploying and scaling applications with Google\'s infrastructure.'
  }
];