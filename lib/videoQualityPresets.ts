import { VideoPresets } from 'livekit-client';

export type VideoQuality = 'auto' | '1080p' | '720p' | '360p' | '216p';

export const VIDEO_QUALITY_PRESETS: Record<VideoQuality, any> = {
  auto: undefined,
  '1080p': VideoPresets.h1080,
  '720p': VideoPresets.h720,
  '360p': VideoPresets.h360,
  '216p': VideoPresets.h216,
};

export const VIDEO_QUALITIES = {
    auto: undefined,
  '1080p': VideoPresets.h1080,
  '720p': VideoPresets.h720,
  '360p': VideoPresets.h360,
  '216p': VideoPresets.h216,
};