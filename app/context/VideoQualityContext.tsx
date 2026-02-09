// VideoQualityContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

export type VideoQuality = 'auto' | '720p' | '480p' | '360p' ;

const VideoQualityContext = createContext<{
  quality: VideoQuality;
  setQuality: (q: VideoQuality) => void;
} | null>(null);

export function VideoQualityProvider({ children }: { children: React.ReactNode }) {
  const [quality, setQuality] = useState<VideoQuality>('auto');

  return (
    <VideoQualityContext.Provider value={{ quality, setQuality }}>
      {children}
    </VideoQualityContext.Provider>
  );
}

export function useVideoQuality() {
  const ctx = useContext(VideoQualityContext);
  if (!ctx) throw new Error('useVideoQuality must be used inside VideoQualityProvider');
  return ctx;
}
