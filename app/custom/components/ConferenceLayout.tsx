import { GridLayout, ParticipantTile, useRoomContext, useTracks } from '@livekit/components-react';
import { useVideoQuality } from '../../context/VideoQualityContext';
import { VideoPresets, Track, Room, LocalVideoTrack } from 'livekit-client';
import { useEffect } from 'react';
import { CustomControlBar } from './ControlBar';
import { RoomAudioRenderer } from '@livekit/components-react';
import { VideoQualityKey } from '@/lib/videoQualityPresets';


async function applyLocalVideoQuality(
  room: Room,
  quality: VideoQualityKey,
) {
  const pub = room.localParticipant
    .getTrackPublications()
    .find(p => p.source === Track.Source.Camera);

  if (!pub || !(pub.track instanceof LocalVideoTrack)) return;

if (quality === 'auto') {
  await pub.track.restartTrack({
    resolution: VideoPresets.h720,
  });

  return;
}

  const resolutionMap: Record<Exclude<VideoQualityKey, 'auto'>, {
    width: number;
    height: number;
    frameRate: number;
   }> = {
    '720p':  { width: 1280, height: 720,  frameRate: 24 },
    '480p':  { width: 854,  height: 480,  frameRate: 24 },
    '360p':  { width: 640,  height: 360,  frameRate: 24 },
  };

  const constraints = resolutionMap[quality];

  await pub.track.restartTrack(constraints);
}

export function ConferenceLayout() {
  const room = useRoomContext();

  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false },
  );

  const { quality } = useVideoQuality();

  useEffect(() => {
    if (!room) return;

    applyLocalVideoQuality(room, quality);
  }, [room, quality]);

  return (
    <>
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
      <RoomAudioRenderer />
      <CustomControlBar />
    </>
  );
}

