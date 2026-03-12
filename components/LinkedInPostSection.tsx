import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Linkedin, ExternalLink } from 'lucide-react';

interface LinkedInPostSectionProps {
  id: string;
}

const LinkedInPostSection: React.FC<LinkedInPostSectionProps> = ({ id }) => {
  // Default placeholder post URL (can be updated to a real one)
  const [postUrl, setPostUrl] = useState('https://www.linkedin.com/embed/feed/update/urn:li:share:7314545606494961664');
  const [inputUrl, setInputUrl] = useState('');

  const handleUpdateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      // Basic check to see if it's already an embed URL
      if (inputUrl.includes('/embed/')) {
        setPostUrl(inputUrl);
      } else {
        // Try to convert a standard post URL to an embed URL if possible
        // Note: This is a basic conversion, LinkedIn URLs can vary
        const match = inputUrl.match(/urn:li:(?:activity|share|ugcPost):\d+/);
        if (match) {
          setPostUrl(`https://www.linkedin.com/embed/feed/update/${match[0]}`);
        } else {
          // Fallback if we can't parse it easily
          alert('Please provide a valid LinkedIn embed URL or post URL containing a URN.');
        }
      }
      setInputUrl('');
    }
  };

  return (
    <section id={id} className="py-20 bg-white dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4"
          >
            <Linkedin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
          >
            Recent LinkedIn Posts
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Check out my latest thoughts, updates, and professional milestones.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Update Post</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              To change the embedded post, paste a LinkedIn embed URL or a standard post URL below.
            </p>
            <form onSubmit={handleUpdateUrl} className="space-y-4">
              <div>
                <label htmlFor="linkedin-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  id="linkedin-url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/embed/feed/update/..."
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Update Embed
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View full profile on LinkedIn <ExternalLink size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-2/3 max-w-2xl flex justify-center"
          >
            <div className="w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 min-h-[400px] flex items-center justify-center">
              {postUrl ? (
                <>
                  <iframe
                    src={postUrl}
                    height="600"
                    width="50%"
                    frameBorder="0"
                    allowFullScreen={true}
                    title="Embedded LinkedIn Post"
                    className="w-full bg-white"
                  ></iframe>
                </>

              ) : (
                <div className="text-slate-500 dark:text-slate-400 text-center p-8">
                  <Linkedin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No post URL provided.</p>
                </div>
              )}
            </div>


          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LinkedInPostSection;
