import React from 'react';
import { motion } from '../utils/framerMotionMock';
import { Mail, Github, Linkedin, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Feel free to reach out for collaborations or just a friendly hello
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-800 rounded-lg p-8"
          >
            <h3 className="text-xl font-bold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="mr-3 text-teal-400" size={20} />
                <a href="mailto:abhinay.sharma@example.com" className="hover:text-teal-400 transition-colors">
                  abhinay.sharma@example.com
                </a>
              </div>
              <div className="flex items-center">
                <Linkedin className="mr-3 text-teal-400" size={20} />
                <a href="https://linkedin.com/in/abhinay-sharma" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                  linkedin.com/in/abhinay-sharma
                </a>
              </div>
              <div className="flex items-center">
                <Github className="mr-3 text-teal-400" size={20} />
                <a href="https://github.com/abhinay-sharma" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                  github.com/abhinay-sharma
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-gray-800 rounded-lg p-8"
          >
            <h3 className="text-xl font-bold mb-4">Let's Connect</h3>
            <p className="text-gray-400 mb-6">
              Interested in working together or have a question? Feel free to send me a message and I'll get back to you as soon as possible.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                href="https://twitter.com/abhinay-sharma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Twitter size={20} />
              </motion.a>
              <motion.a
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                href="https://linkedin.com/in/abhinay-sharma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
              >
                <Linkedin size={20} />
              </motion.a>
              <motion.a
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                href="https://github.com/abhinay-sharma" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <Github size={20} />
              </motion.a>
              <motion.a
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                href="mailto:abhinay.sharma@example.com"
                className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors"
              >
                <Mail size={20} />
              </motion.a>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500">
            © {currentYear} Abhinay Sharma. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;