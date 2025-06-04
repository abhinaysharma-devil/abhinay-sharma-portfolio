import React from 'react';

// This is a simplified mock of Framer Motion to make the portfolio work
// without adding additional dependencies

interface MotionProps {
  children: React.ReactNode;
  initial?: any;
  animate?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  transition?: any;
  viewport?: any;
  exit?: any;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const motion = {
  div: ({ children, className, style, onClick }: MotionProps) => (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  ),
  a: ({ children, className, style, onClick }: MotionProps) => (
    <a className={className} style={style} onClick={onClick}>
      {children}
    </a>
  ),
  button: ({ children, className, style, onClick }: MotionProps) => (
    <button className={className} style={style} onClick={onClick}>
      {children}
    </button>
  ),
};

interface AnimatePresenceProps {
  children: React.ReactNode;
}

export const AnimatePresence: React.FC<AnimatePresenceProps> = ({ children }) => {
  return <>{children}</>;
};