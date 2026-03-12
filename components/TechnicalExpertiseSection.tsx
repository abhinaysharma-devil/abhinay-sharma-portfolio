import React from 'react';
import { ExpertiseArea } from '../types';
import Chip from './ui/Chip';
import { Lightbulb, Cog, ShieldCheck, Users, MonitorSmartphone, Construction, Rocket } from 'lucide-react'; 

interface TechnicalExpertiseSectionProps {
  id: string;
  expertiseAreas: ExpertiseArea[];
}

// Fallback icon map if specific area.Icon is not provided
const iconMap: { [key: string]: React.ElementType } = {
  backend: Cog,
  frontend: MonitorSmartphone, 
  'cloud-devops': Construction,
  'problem-solving': Rocket,
  default: Lightbulb, // A generic default icon
};


const TechnicalExpertiseSection: React.FC<TechnicalExpertiseSectionProps> = ({ id, expertiseAreas }) => {
  return (
    <section id={id} className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Core Competencies</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">My key areas of technical proficiency and specialization.</p>
        </div>
        <div className="space-y-12">
          {expertiseAreas.map((area, index) => {
            // Prioritize area.Icon, then specific iconMap entry, then default iconMap entry
            const IconComponent = area.Icon || iconMap[area.id] || iconMap.default;
            return (
            <div 
              key={area.id} 
              className="bg-white dark:bg-custom-dark-card p-6 md:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl animate-slide-in-right"
              style={{ animationDelay: `${index * 150}ms`, opacity: 0 }} // opacity 0 for animation
              >
              <div className="flex items-start space-x-4 md:space-x-6">
                 <div className="flex-shrink-0 mt-1">
                    <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-custom-accent dark:text-sky-400" />
                  </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">{area.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{area.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {area.skills.map((skill) => (
                      <Chip key={skill} text={skill} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
};

export default TechnicalExpertiseSection;
