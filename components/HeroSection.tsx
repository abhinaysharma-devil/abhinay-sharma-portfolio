
import React from 'react';
import { motion } from 'motion/react';
import { fullName, designation, heroIntroLines, socialLinks } from '../constants';
import AnimatedIntro from './ui/AnimatedIntro';
import { ArrowDown } from 'lucide-react';
import abhi from '../assets/abhi.png';


interface HeroSectionProps {
  id: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ id }) => {
  const scrollToNextSection = () => {
    const nextSection = document.getElementById('tech-stack');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="min-h-screen relative flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-slate-50 dark:bg-custom-dark-bg transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-custom-dark-bg dark:to-custom-dark-bg"></div>
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl"
        />
        <motion.div 
          animate={{ 
            y: [0, 40, 0],
            x: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl"
        />
      </div>
      
      <div className="container mx-auto px-6 md:px-12 z-10 w-full max-w-7xl">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Left Content - Text & CTAs */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-4 py-1.5 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium text-sm tracking-wide border border-indigo-200 dark:border-indigo-800/50 shadow-sm"
            >
              👋 Welcome to my portfolio
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 font-['Orbitron'] tracking-tight text-slate-900 dark:text-white leading-tight">
              Hi, I'm <br className="hidden lg:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                {fullName}
              </span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-medium text-slate-700 dark:text-slate-300 mb-6">
              {designation}
            </h2>
            
            <div className="mb-8 max-w-lg text-lg text-slate-600 dark:text-slate-400">
              <AnimatedIntro lines={heroIntroLines} />
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start mb-12"
            >
              <a 
                href="#projects" 
                className="px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1"
              >
                View My Work
              </a>
              <a 
                href="#contact" 
                className="px-8 py-3.5 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 font-medium transition-all hover:-translate-y-1 shadow-sm"
              >
                Contact Me
              </a>
            </motion.div>

            {/* Find me here */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="w-full"
            >
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Find me here
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                {socialLinks.filter(link => ['linkedin', 'github', 'email'].includes(link.id)).map((link, index) => {
                  const Icon = link.Icon;
                  return (
                    <motion.a 
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                      aria-label={link.name}
                    >
                      <Icon size={24} />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Large Image Placeholder */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex justify-center lg:justify-end relative mt-10 lg:mt-0"
          >
            {/* Decorative background glow for the image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 rounded-full blur-3xl -z-10"></div>
            
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] xl:w-[550px] xl:h-[550px] flex items-end justify-center"
            >
              {/* 
                User's PNG Image goes here. 
                Using object-contain ensures the transparent PNG fits well without cropping.
                The drop-shadow makes the transparent PNG pop against the background.
              */}
              <img 
                src={abhi}
                alt={fullName} 
                className="w-full h-full object-contain drop-shadow-2xl z-10"
                style={{
                  // This mask creates a nice fade at the bottom. 
                  // It looks great with rectangular photos and doesn't hurt transparent PNGs.
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                }}
                onError={(e) => {
                  // Fallback just in case
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3';
                }}
              />
              
              {/* Floating badges/elements around the image */}
              <motion.div 
                animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-10 right-0 md:-right-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-20"
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Available for work</span>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [5, -5, 5], rotate: [2, -2, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-0 md:-left-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-20"
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">4+</span>
                  <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Years Exp.</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </div>
      
      {/* Scroll Down Indicator */}
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={scrollToNextSection}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 p-3 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
        aria-label="Scroll to next section"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={32} />
        </motion.div>
      </motion.button>
    </section>
  );
};

export default HeroSection;
