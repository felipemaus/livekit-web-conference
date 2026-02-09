// lib/videoQualityPresets.ts
import { VideoPresets } from 'livekit-client';

export type VideoQualityKey =
  | 'auto'
  | '720p'
  | '480p'
  | '360p'

export const VIDEO_QUALITY_PRESETS: Record<
  VideoQualityKey,
  { resolution?: { width: number; height: number; frameRate?: number } }
> = {
  auto: {},
  '720p': { resolution: VideoPresets.h720 },
  '480p': {
    resolution: { width: 854, height: 480, frameRate: 30 },
  },
  '360p': { resolution: VideoPresets.h360 },
};
