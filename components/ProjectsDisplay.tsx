
import React from 'react';
import { Project } from '../types';
import Card from './ui/Card';

interface ProjectsDisplayProps {
  id?: string;
  title: string;
  projects: Project[];
  isPersonal?: boolean;
}

const ProjectsDisplay: React.FC<ProjectsDisplayProps> = ({ id, title, projects, isPersonal = false }) => {
  return (
    <section id={id} className="py-16 md:py-24 bg-white dark:bg-custom-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            {isPersonal ? "Explorations and experiments from my personal lab." : "Highlights of impactful professional engagements."}
          </p>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} // Start with opacity 0 for animation
              >
                <Card project={project} isPersonal={isPersonal} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No projects to display in this category yet.</p>
        )}
      </div>
    </section>
  );
};

export default ProjectsDisplay;
