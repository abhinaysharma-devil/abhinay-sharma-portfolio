import { LucideIcon } from 'lucide-react';

export interface NavLink {
  name: string;
  href: string;
}

export interface TechStackItem {
  id: string;
  name: string;
  Icon: LucideIcon;
  description: string;
  color: string; // Tailwind color class for icon/border, e.g., 'text-blue-500'
}

export interface Project {
  id: string;
  name: string;
  logoUrl: string; // URL for project logo (placeholder or actual)
  description: string;
  technologies: string[];
  link?: string; // External link for personal projects
}

export interface ExpertiseArea {
  id: string;
  title: string;
  description: string;
  skills: string[]; // Names of skills/technologies as chips
  Icon?: LucideIcon; // Optional icon for the expertise area
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  Icon: LucideIcon;
}

export type Theme = 'light' | 'dark';
