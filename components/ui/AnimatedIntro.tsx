import React, { useState, useEffect } from 'react';

interface AnimatedIntroProps {
  lines: string[];
  typingSpeed?: number;
  pauseDuration?: number;
}

const AnimatedIntro: React.FC<AnimatedIntroProps> = ({ 
  lines, 
  typingSpeed = 100, 
  pauseDuration = 1500 
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeoutId: number; // Changed from NodeJS.Timeout to number

    if (isTyping) {
      if (displayText.length < lines[currentLineIndex].length) {
        timeoutId = window.setTimeout(() => { // Explicitly use window.setTimeout
          setDisplayText(lines[currentLineIndex].substring(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing current line
        setIsTyping(false);
        timeoutId = window.setTimeout(() => { // Explicitly use window.setTimeout
          // Prepare for next line or loop
          setIsTyping(true);
          setDisplayText('');
          setCurrentLineIndex((prevIndex) => (prevIndex + 1) % lines.length);
        }, pauseDuration);
      }
    }

    return () => window.clearTimeout(timeoutId); // Explicitly use window.clearTimeout
  }, [displayText, isTyping, currentLineIndex, lines, pauseDuration, typingSpeed]);

  return (
    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 min-h-[2.5em] md:min-h-[2.8em]">
      {displayText}
      <span className="animate-pulse text-gray-600 dark:text-gray-400">|</span> {/* Blinking cursor */}
    </p>
  );
};

export default AnimatedIntro;
