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
  background?: string;
  size?: string;
  link?: string; // External link for personal projects
  route?: string; // Internal route for navigation (e.g., /personal/airdraw)
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

export interface VisitorLog {
  id?: string;
  _id?: string;
  ip: string;
  isUniqueIp: boolean;
  visitCount: number;
  timestamp: string;
  path: string;
  referrer: string;
  browser: {
    name: string;
    version: string;
  };
  os: {
    name: string;
    version?: string;
  };
  device: {
    type: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  };
  screen: {
    width: number;
    height: number;
    resolution: string;
  };
  viewport: {
    width: number;
    height: number;
  };
  language: string;
  timezone: string;
  sessionId?: string;
  userAgent: string;
  location?: {
    country?: string;
    countryCode?: string;
    city?: string;
    region?: string;
  };
  firstVisitAt?: string;
  lastVisitAt?: string;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  topBrowsers: { name: string; count: number }[];
  topOperatingSystems: { name: string; count: number }[];
  topDevices: { type: string; count: number }[];
  topPaths: { path: string; count: number }[];
}

export interface VisitorApiResponse {
  success: boolean;
  message?: string;
  logs?: VisitorLog[];
  stats?: VisitorStats;
  dbConnected?: boolean;
}

