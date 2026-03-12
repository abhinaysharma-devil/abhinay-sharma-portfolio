
import React from 'react';
import { Project } from '../../types';
import { ExternalLink, Briefcase } from 'lucide-react'; // Using Briefcase as a generic project icon
import { i } from 'motion/react-client';

interface CardProps {
  project: Project;
  isPersonal?: boolean;
}

const Card: React.FC<CardProps> = ({ project, isPersonal }) => {
  const CardContent: React.FC = () => (
    <>
      <div
        className={`w-full h-40 items-center justify-center flex object-cover ${project.background || 'bg-gray-200 dark:bg-gray-800'} rounded-t-lg mb-4 group-hover:opacity-80 transition-opacity duration-300`}>
        <img
          src={project.logoUrl || `https://picsum.photos/seed/${project.id}/300/200`}
          alt={`${project.name} logo`}
          className={`${project.size || 'w-full h-full'} object-cover group-hover:opacity-80 transition-opacity duration-300`}
          onError={(e) => (e.currentTarget.src = 'https://picsum.photos/300/200?grayscale')} // Fallback image
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-custom-accent dark:group-hover:text-sky-400 transition-colors duration-300">
          {project.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow leading-relaxed">{project.description}</p>

        {project.additional_link_key && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Additional Like Key:</p>
            <div className="flex flex-wrap gap-1">
              {project.additional_link_key.map((item, index) => (
                <a
                  key={index}
                  href={project.additional_link[index]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span key={item} className="px-2 py-0.5 text-xs bg-purple-200 text-purple-800 dark:bg-purple-700/30 dark:text-purple-300 rounded-full">
                    {item}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        {project.technologies && project.technologies.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Key Technologies:</p>
            <div className="flex flex-wrap gap-1">
              {project.technologies.slice(0, 4).map(tech => ( // Show max 4 techs
                <span key={tech} className="px-2 py-0.5 text-xs bg-custom-accent/10 text-custom-accent dark:bg-sky-400/10 dark:text-sky-400 rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
        {isPersonal && project.link && (
          <a
            href={project.link}
            target="_blank"
            aria-label={`View ${project.name} project (opens in new tab)`}
          >
            <div className="mt-auto pt-2">
              <span className="inline-flex items-center text-sm font-medium text-custom-accent dark:text-sky-400 group-hover:underline">

                View Project <ExternalLink size={16} className="ml-1" />
              </span>
            </div>
          </a>
        )}
      </div>
    </>
  );

  const commonClasses = "group bg-white dark:bg-custom-dark-card rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-1";

  if (isPersonal && project.link) {
    return (
      <div
        // href={project.link}
        // target="_blank"
        rel="noopener noreferrer"
        className={`${commonClasses}`}
        aria-label={`View ${project.name} project (opens in new tab)`}
      >
        <CardContent />
      </div>
    );
  }

  return (
    <div className={commonClasses}>
      <CardContent />
    </div>
  );
};

export default Card;
