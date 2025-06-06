import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TechLogo from './TechLogo';
import { techLogos } from '../data/techData';
import abhinay_img from '../../public/abhinay_mg.png'
 
const Hero: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = "Building robust and scalable web solutions";
  const [typingIndex, setTypingIndex] = useState(0);
  
  useEffect(() => {
    if (typingIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prevText => prevText + fullText[typingIndex]);
        setTypingIndex(prevIndex => prevIndex + 1);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [typingIndex]);

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left"
          >
            <motion.div 
              className="mb-8 flex justify-center md:justify-start"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <motion.div 
                className="w-48 h-48 rounded-full overflow-hidden shadow-xl border-4 border-teal-500 dark:border-teal-400"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <img
                  src={abhinay_img}
                  alt="Abhinay Sharma"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Abhinay Sharma
            </motion.h1>
            <motion.h2 
              className="text-2xl md:text-3xl font-medium mb-6 text-teal-600 dark:text-teal-400"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Software Developer
            </motion.h2>
            <div className="h-16 mb-8">
              <p className="text-xl text-gray-700 dark:text-gray-300 relative after:content-['_'] after:inline-block after:w-0.5 after:h-6 after:bg-teal-600 dark:after:bg-teal-400 after:animate-blink after:ml-1 after:align-middle">
                {typedText}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a 
                href="#contact" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                Get In Touch
              </a>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden md:flex justify-center items-center"
          >
            <div className="relative w-full h-96">
              {techLogos.map((logo, index) => (
                <TechLogo 
                  key={logo.name}
                  name={logo.name}
                  icon={logo.icon}
                  index={index}
                  total={techLogos.length}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;