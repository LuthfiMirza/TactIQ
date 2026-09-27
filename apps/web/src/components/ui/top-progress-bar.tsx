'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Complete progress on route change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links for 0ms instant feedback
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Only handle internal navigation links that navigate to a new route
      if (
        href.startsWith('/') &&
        !href.startsWith('//') &&
        target.target !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const cleanHref = href.split('?')[0].split('#')[0];
        const currentClean = window.location.pathname;

        // If clicking a different route, trigger immediate progress
        if (cleanHref !== currentClean) {
          setVisible(true);
          setProgress(25);
          setTimeout(() => setProgress((prev) => (prev < 65 ? 65 : prev)), 100);
          setTimeout(() => setProgress((prev) => (prev < 85 ? 85 : prev)), 300);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#CEFF00] shadow-[0_0_10px_rgba(206,255,0,0.8),0_0_4px_rgba(206,255,0,0.9)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '400ms',
        }}
      />
    </div>
  );
}
