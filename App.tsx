
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TechStackSection from './components/TechStackSection';
import ProjectsDisplay from './components/ProjectsDisplay';
import TechnicalExpertiseSection from './components/TechnicalExpertiseSection';
import LinkedInPostSection from './components/LinkedInPostSection';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ui/ScrollToTopButton';
import { companyProjects, personalProjects, techStack, expertiseAreas, socialLinks } from './constants';
import { Theme } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
    }
    return 'dark'; // Default to dark mode
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Tech Stack', href: '#tech-stack' },
    { name: 'Projects', href: '#projects' },
    { name: 'Expertise', href: '#expertise' },
    { name: 'LinkedIn', href: '#linkedin-post' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-custom-dark-bg transition-colors duration-500">
      <Navbar navLinks={navLinks} currentTheme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <HeroSection id="hero" />
        <TechStackSection id="tech-stack" techStack={techStack} />
        <ProjectsDisplay id="projects" title="Company Projects" projects={companyProjects} />
        <ProjectsDisplay title="Personal Projects" projects={personalProjects} isPersonal={true} />
        <TechnicalExpertiseSection id="expertise" expertiseAreas={expertiseAreas} />
        {/* <LinkedInPostSection id="linkedin-post" /> */}
      </main>
      <Footer id="contact" socialLinks={socialLinks} />
      <ScrollToTopButton />
    </div>
  );
};

export default App;
