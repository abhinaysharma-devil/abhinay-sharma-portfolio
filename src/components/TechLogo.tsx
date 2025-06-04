import React from 'react';
import { motion } from '../utils/framerMotionMock';

interface TechLogoProps {
  name: string;
  icon: React.ElementType;
  index: number;
  total: number;
}

const TechLogo: React.FC<TechLogoProps> = ({ name, icon: Icon, index, total }) => {
  // Calculate position in a circle
  const angle = (index / total) * Math.PI * 2;
  const radius = 150; // Size of the circle
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      initial={{ x, y, opacity: 0 }}
      animate={{ 
        x, 
        y, 
        opacity: 1,
        transition: { 
          delay: index * 0.2,
          duration: 0.5 
        }
      }}
      whileHover={{ 
        scale: 1.2,
        zIndex: 10,
        transition: { duration: 0.3 }
      }}
      style={{ 
        transformOrigin: "center center",
        transform: `translate(${x}px, ${y}px)` 
      }}
    >
      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center p-3">
        <Icon className="w-full h-full text-teal-600 dark:text-teal-400" />
      </div>
      <span className="mt-2 text-sm font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {name}
      </span>
    </motion.div>
  );
};

export default TechLogo;