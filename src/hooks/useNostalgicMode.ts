import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'escrow-nostalgic';

export function useNostalgicMode() {
  const [nostalgic, setNostalgic] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const LINK_ID = 'css-98';
    if (nostalgic) {
      root.classList.add('theme-98');
      // Load 98.css via <link> to avoid lightningcss minification issues
      if (!document.getElementById(LINK_ID)) {
        const link = document.createElement('link');
        link.id = LINK_ID;
        link.rel = 'stylesheet';
        link.href = '/98.css';
        document.head.appendChild(link);
      }
    } else {
      root.classList.remove('theme-98');
      document.getElementById(LINK_ID)?.remove();
    }
  }, [nostalgic]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(nostalgic));
    } catch { /* ignore */ }
  }, [nostalgic]);

  const enableNostalgic = useCallback(() => setNostalgic(true), []);
  const disableNostalgic = useCallback(() => setNostalgic(false), []);

  return { nostalgic, enableNostalgic, disableNostalgic };
}
