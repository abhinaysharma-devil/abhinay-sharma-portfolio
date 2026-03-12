
import React from 'react';
import { SocialLink } from '../types';
import { fullName } from '../constants';

interface FooterProps {
  id: string;
  socialLinks: SocialLink[];
}

const Footer: React.FC<FooterProps> = ({ id, socialLinks }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id={id} className="bg-gray-100 dark:bg-custom-dark-bg border-t border-gray-200 dark:border-slate-700 py-12 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Get In Touch</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
        </p>
        <div className="flex justify-center space-x-6 mb-8">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="text-gray-500 dark:text-gray-400 hover:text-custom-accent dark:hover:text-sky-400 transition-transform duration-200 hover:scale-125"
            >
              <link.Icon size={28} />
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {currentYear} {fullName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
