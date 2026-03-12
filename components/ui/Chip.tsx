
import React from 'react';

interface ChipProps {
  text: string;
}

const Chip: React.FC<ChipProps> = ({ text }) => {
  return (
    <span className="px-3 py-1 text-sm bg-custom-accent/10 text-custom-accent dark:bg-sky-400/20 dark:text-sky-300 rounded-full hover:bg-custom-accent/20 dark:hover:bg-sky-400/30 transition-colors duration-200 cursor-default">
      {text}
    </span>
  );
};

export default Chip;
