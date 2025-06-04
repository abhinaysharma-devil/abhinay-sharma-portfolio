import React from 'react';
import { motion } from '../utils/framerMotionMock';
import { techLogos } from '../data/techData';

const TechStack: React.FC = () => {
  return (
    <section id="tech-stack" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Tech Stack
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Technologies and tools I specialize in to build robust and scalable applications
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {techLogos.map((tech, index) => {
            const Icon = tech.icon;
            
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 flex flex-col items-center transition-all hover:shadow-lg"
              >
                <div className="w-16 h-16 mb-4 text-teal-600 dark:text-teal-400">
                  <Icon className="w-full h-full" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {tech.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                  {tech.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechStack;