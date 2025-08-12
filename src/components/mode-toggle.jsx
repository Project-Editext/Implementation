'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, SunMoon } from 'lucide-react';

const ModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return null;

  const renderIcon = () => {
    if (theme === 'dark')
      return <MoonIcon className="w-5 h-5 text-yellow-400" />;
    if (theme === 'system')
      return <SunMoon className="w-5 h-5 text-yellow-400" />;
    return <SunIcon className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        aria-label="Toggle theme menu"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full  hover:bg-gray-100 transition shadow-md"
      >
        {renderIcon()}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {['system', 'dark', 'light'].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTheme(mode);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  theme === mode
                    ? 'bg-yellow-100 dark:bg-yellow-800 font-medium'
                    : 'hover:bg-yellow-50 dark:hover:bg-yellow-700'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeToggle;
