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
  const maxBitrateByQuality: Record<VideoQualityKey, number | undefined> = {
    auto: 2_000_000,
    '720p': 2_000_000,
    '480p': 1_200_000,
    '360p': 700_000,
  };

  const applyQuality = async (q: VideoQualityKey) => {
    if (!room) return;

    const publication = localParticipant
      .getTrackPublications()
      .find(p => p.source === Track.Source.Camera);

    if (!publication || !(publication.track instanceof LocalVideoTrack)) {
      return;
    }

    const track = publication.track;
    const sender = track.sender;
    const preset = VIDEO_QUALITY_PRESETS[q];

    // Atualiza UI imediatamente para refletir a escolha do usuário,
    // mesmo em navegadores que não aceitam setParameters (Safari/iOS).
    setQuality(q);
    setOpen(false);

    // Em mobile/Safari, alterar parâmetros do sender muitas vezes não muda
    // a resolução capturada. Reiniciar a track aplica constraints reais.
    await track.restartTrack(
      preset?.resolution ? { resolution: preset.resolution } : undefined,
    );

    if (!sender) return;

    const params = sender.getParameters();
 
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }

    const maxBitrate = maxBitrateByQuality[q];
    if (maxBitrate) {
      params.encodings[0] = {
        ...params.encodings[0],
        maxBitrate,
        maxFramerate: preset?.resolution?.frameRate,
      };
    } else {
      delete params.encodings?.[0]?.maxBitrate;
      delete params.encodings?.[0]?.maxFramerate;
    }

    try {
      await sender.setParameters(params);
    } catch (error) {
      console.warn('Video quality sender parameters not supported in this browser', error);
    }
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
