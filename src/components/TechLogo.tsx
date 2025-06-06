import React from 'react';
import { motion } from 'framer-motion';

interface TechLogoProps {
  name: string;
  icon: React.ElementType;
  index: number;
  total: number;
}

const TechLogo: React.FC<TechLogoProps> = ({ name, icon: Icon, index, total }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 150;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ x, y, opacity: 0, scale: 0 }}
      animate={{ 
        x, 
        y, 
        opacity: 1,
        scale: 1,
        transition: { 
          delay: index * 0.2,
          duration: 0.5,
          type: "spring",
          stiffness: 260,
          damping: 20
        }
      }}
      whileHover={{ 
        scale: 1.2,
        zIndex: 10,
        transition: { type: "spring", stiffness: 300, damping: 10 }
      }}
    >
      <motion.div 
        className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center p-3 relative group"
        whileHover={{
          rotate: 360,
          transition: { duration: 0.6 }
        }}
      >
        <Icon className="w-full h-full text-teal-600 dark:text-teal-400" />
        <motion.span 
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-sm font-medium text-gray-800 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100"
          initial={{ y: 10, opacity: 0 }}
          whileHover={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {name}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default TechLogo;