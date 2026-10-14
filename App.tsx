
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PortfolioHome from './components/PortfolioHome';
import AirDraw from './components/AirDraw';
import { Theme } from './types';
import JetFighterGame from './components/jetFighterComp';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioHome theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/personal/airdraw" element={<AirDraw />} />
        <Route path="/personal/jetfighter" element={<JetFighterGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
