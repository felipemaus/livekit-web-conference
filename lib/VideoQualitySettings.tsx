import React from 'react';
import {
  createLocalVideoTrack,
  LocalVideoTrack,
} from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { VIDEO_QUALITIES, VideoQuality } from '@/lib/videoQualityPresets';

export function VideoQualitySettings() {
  const room = useRoomContext();
  const [quality, setQuality] = React.useState<VideoQuality>('auto');
  const [loading, setLoading] = React.useState(false);

  async function changeQuality(newQuality: VideoQuality) {
    if (!room) return;

    setLoading(true);
    setQuality(newQuality);

    const publication = room.localParticipant
      .getTrackPublications()
      .find((p) => p.kind === 'video');

    if (!(publication?.track instanceof LocalVideoTrack)) {
      setLoading(false);
      return;
    }

    // cria novo track com nova resolução
    const newTrack = await createLocalVideoTrack({
      resolution: VIDEO_QUALITIES[newQuality],
    });

    // ✅ API correta para essa versão
    await publication.track.replaceTrack(newTrack.mediaStreamTrack);


    setLoading(false);
  }


  return (
    <select
      value={quality}
      disabled={loading}
      onChange={(e) => changeQuality(e.target.value as VideoQuality)}
    >
      <option value="auto">Auto</option>
      <option value="1080p">1080p</option>
      <option value="720p">720p</option>
      <option value="360p">360p</option>
      <option value="216p">216p</option>
    </select>
  );
}
