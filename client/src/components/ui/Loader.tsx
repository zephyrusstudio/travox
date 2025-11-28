import React, { useEffect, useRef, useState } from 'react';

interface LoaderProps {
  isLoading: boolean;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ isLoading, className = '' }) => {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      // Gradually increase progress to 90%
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressRef.current) clearInterval(progressRef.current);
            return 90;
          }
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 100);
    } else {
      // Complete the progress bar when loading finishes
      setProgress((prev) => {
        if (prev > 0) {
          setTimeout(() => setProgress(0), 300);
          return 100;
        }
        return prev;
      });
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [isLoading]);

  if (progress === 0) return null;

  return (
    <div className={`absolute bottom-0 left-0 h-0.5 bg-blue-100 overflow-hidden w-[calc(100%-10px)] mx-[5px] ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default Loader;
