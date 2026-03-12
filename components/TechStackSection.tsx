
import React from 'react';
import { TechStackItem } from '../types';
import TechLogo from './ui/TechLogo'; 

interface TechStackSectionProps {
  id: string;
  techStack: TechStackItem[];
}

const TechStackSection: React.FC<TechStackSectionProps> = ({ id, techStack }) => {
  return (
    <section id={id} className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">My Tech Arsenal</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Tools and technologies I leverage to build amazing things.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {techStack.map((tech, index) => (
            <div 
              key={tech.id} 
              className="group bg-white dark:bg-custom-dark-card p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} // Start with opacity 0 for animation
            >
              <div className="mb-4">
                <TechLogo name={tech.name} Icon={tech.Icon} color={tech.color} tooltipText={tech.name} interactive={false} size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{tech.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
