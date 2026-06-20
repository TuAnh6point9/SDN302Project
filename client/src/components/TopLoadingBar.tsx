import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router-dom';

export default function TopLoadingBar() {
  const navigation = useNavigation();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen to React Router navigation changes
    const isNavigating = navigation.state === 'loading';
    
    // Track API requests
    let apiLoadingCount = 0;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    
    const handleApiStart = () => {
      apiLoadingCount++;
      if (apiLoadingCount > 0) {
        setActive(true);
      }
    };

    const handleApiEnd = () => {
      apiLoadingCount = Math.max(0, apiLoadingCount - 1);
      if (apiLoadingCount === 0) {
        setProgress(100);
        hideTimer = setTimeout(() => {
          setActive(false);
          setProgress(0);
        }, 300);
      }
    };

    window.addEventListener('api-loading-start', handleApiStart);
    window.addEventListener('api-loading-end', handleApiEnd);

    if (isNavigating) {
      transitionTimer = setTimeout(() => {
        setActive(true);
        setProgress((prev) => Math.min(prev + 10, 80));
      }, 0);
    } else {
      if (apiLoadingCount === 0) {
        transitionTimer = setTimeout(() => {
          setProgress(100);
          hideTimer = setTimeout(() => {
            setActive(false);
            setProgress(0);
          }, 300);
        }, 0);
      }
    }

    return () => {
      window.removeEventListener('api-loading-start', handleApiStart);
      window.removeEventListener('api-loading-end', handleApiEnd);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [navigation.state]);

  // Handle progress animation timer
  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const diff = Math.random() * 8;
        return Math.min(prev + diff, 90);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-emerald-400 z-[99999] transition-all duration-300 ease-out shadow-[0_1px_10px_rgba(16,185,129,0.5)]"
      style={{ width: `${progress}%` }}
    />
  );
}
