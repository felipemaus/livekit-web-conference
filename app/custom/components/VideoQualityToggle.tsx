import * as React from 'react';
import {
  Track,
  LocalVideoTrack,
} from 'livekit-client';
import {
  useRoomContext,
  useLocalParticipant,
  GearIcon,
} from '@livekit/components-react';
import { VIDEO_QUALITY_PRESETS, VideoQualityKey } from '@/lib/videoQualityPresets';
import { useVideoQuality } from '@/app/context/VideoQualityContext';

export function VideoQualityToggle() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [open, setOpen] = React.useState(false);
  const { quality, setQuality } = useVideoQuality();

  const applyQuality = async (q: VideoQualityKey) => {
    if (!room) return;

    const publication = localParticipant
      .getTrackPublications()
      .find(p => p.source === Track.Source.Camera);

    if (!publication || !(publication.track instanceof LocalVideoTrack)) {
      return;
    }

    const sender = publication.track.sender;
    if (!sender) return;

    const params = sender.getParameters();
    const preset = VIDEO_QUALITY_PRESETS[q];

    if (!preset) {
      delete params.encodings?.[0]?.maxBitrate;
      delete params.encodings?.[0]?.maxFramerate;
    } else {
      params.encodings = [
        {
          ...params.encodings?.[0],
          maxBitrate:
            (preset.resolution?.width ?? 0) *
            (preset.resolution?.height ?? 0) *
            1000,
          maxFramerate: preset.resolution?.frameRate,
        },
      ];
    }

    await sender.setParameters(params);
    setQuality(q);
    setOpen(false);
  };

  return (
    <div className="lk-toggle-wrapper">
      {open && (
        <div className="lk-menu">
          {(Object.entries(VIDEO_QUALITY_PRESETS) as [
            VideoQualityKey,
            unknown
          ][]).map(([q]) => (
            <button
              key={q}
              className={`lk-menu-item ${
                quality === q ? 'lk-menu-item-active' : ''
              }`}
              onClick={() => applyQuality(q)}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="lk-button"
        onClick={() => setOpen(o => !o)}
      >
        <GearIcon />
        <span>Video Quality</span>
      </button>
    </div>
  );
}
