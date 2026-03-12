
import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface TechLogoProps {
  name: string;
  Icon: LucideIcon;
  color: string; // Tailwind text color class, e.g., 'text-blue-500'
  tooltipText: string;
  interactive?: boolean;
  size?: number;
}

const TechLogo: React.FC<TechLogoProps> = ({ name, Icon, color, tooltipText, interactive = true, size = 40 }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const iconClasses = `
    ${color} 
    ${interactive ? 'group-hover:scale-125 group-hover:shadow-lg transition-all duration-300' : ''}
  `;

  const containerClasses = `
    relative group flex flex-col items-center p-2 rounded-lg 
    ${interactive ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200' : ''}
  `;

  return (
    <div 
      className={containerClasses}
      onMouseEnter={() => interactive && setShowTooltip(true)}
      onMouseLeave={() => interactive && setShowTooltip(false)}
      aria-label={name}
    >
      <Icon size={size} className={iconClasses} strokeWidth={1.5} />
      {interactive && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
      {!interactive && ( // For non-interactive context like TechStackSection where name is shown below
        <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">{name}</span>
      )}
    </div>
  );
};

export default TechLogo;
