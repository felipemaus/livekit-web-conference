'use client';

import React from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { ConnectionDetails } from '@/lib/types';
import {
  LocalUserChoices,
  PreJoin,
  RoomContext,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomEvent,
  TrackPublishDefaults,
  setLogLevel,
  LogLevel,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';
import { ConferenceLayout } from '@/app/custom/components/ConferenceLayout';
import { VideoQualityProvider } from '@/app/context/VideoQualityContext';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] =
    React.useState<LocalUserChoices>();
  const [connectionDetails, setConnectionDetails] =
    React.useState<ConnectionDetails>();

  const [mediaError, setMediaError] = React.useState<string | null>(null);

  async function ensureMediaPermissions() {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // só precisamos da permissão
      stream.getTracks().forEach(track => track.stop());

      setMediaError(null);
      return true;
    } catch (err) {
      setMediaError(
        'You need to allow the use of the camera and microphone to enter the room.',
      );
      return false;
    } 
  }

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      
      const allowed = await ensureMediaPermissions();
      if (!allowed) {
        // bloqueia entrada
        return;
      }

      setPreJoinChoices(values);

      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', props.roomName);
      url.searchParams.append('participantName', values.username);
      if (props.region) url.searchParams.append('region', props.region);

      const resp = await fetch(url.toString());
      setConnectionDetails(await resp.json());
    },
    [props.roomName, props.region],
  );

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {!connectionDetails || !preJoinChoices ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <PreJoin
            defaults={{ username: '', videoEnabled: true, audioEnabled: true }}
            onSubmit={handlePreJoinSubmit}
            onError={console.error}
          />

          {mediaError && (
            <div
              style={{
                marginTop: '1rem',
                color: '#e5484d',
                textAlign: 'center',
                maxWidth: 320,
              }}
            >
              <p>{mediaError}</p>
            </div>
          )}
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          codec={props.codec}
        />
      )}
    </main>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  codec: VideoCodec;
}) {
  const router = useRouter();
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(worker && e2eePassphrase);

  const [e2eeReady, setE2eeReady] = React.useState(false);

  setLogLevel(LogLevel.error);

  const roomOptions = React.useMemo<RoomOptions>(() => {
    let videoCodec: VideoCodec | undefined = props.codec;
    if (e2eeEnabled && (videoCodec === 'vp9' || videoCodec === 'av1')) {
      videoCodec = undefined;
    }

    const publishDefaults: TrackPublishDefaults = {
      videoCodec,
      red: !e2eeEnabled,
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
    };

    return {
      publishDefaults,
      adaptiveStream: true,
      dynacast: true,
      e2ee: e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: true,
    };
  }, [props.codec, e2eeEnabled, keyProvider, worker]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (!e2eeEnabled) {
      setE2eeReady(true);
      return;
    }

    keyProvider
      .setKey(decodePassphrase(e2eePassphrase))
      .then(() => room.setE2EEEnabled(true))
      .then(() => setE2eeReady(true))
      .catch((e) => {
        if (e instanceof DeviceUnsupportedError) {
          alert('Browser does not support encrypted meetings.');
        } else {
          throw e;
        }
      });
  }, [e2eeEnabled, e2eePassphrase, keyProvider, room]);

  React.useEffect(() => {
    if (!e2eeReady) return;

    room.on(RoomEvent.Disconnected, () => router.push('/'));
    room.on(RoomEvent.MediaDevicesError, console.error);
    room.on(RoomEvent.EncryptionError, console.error);

    room
      .connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken,
        { autoSubscribe: true },
      )
      .then(() => {
        if (props.userChoices.videoEnabled) {
          room.localParticipant.setCameraEnabled(true);
        }
        if (props.userChoices.audioEnabled) {
          room.localParticipant.setMicrophoneEnabled(true);
        }
      })
      .catch(console.error);

    return () => {
      room.removeAllListeners();
    };
  }, [e2eeReady, room, props.connectionDetails, props.userChoices, router]);

  useLowCPUOptimizer(room);

  React.useEffect(() => {
    return () => {
      if (room.state !== 'disconnected') {
        room.disconnect();
      }
    };
  }, [room]);

  React.useEffect(() => {
    function handleLocalTrackPublished(pub: any) {
      if (pub.track?.kind !== 'video') return;

      const sender = pub.track.sender;
      if (!sender) return;

      const interval = setInterval(async () => {
        const stats = await sender.getStats();

        stats.forEach((report: any) => {
          if (report.targetBitrate) {
            console.log('bitrate:', Math.round(report.targetBitrate / 1000), 'kbps');
          }
        });
      }, 2000);

      pub.on('unpublished', () => clearInterval(interval));
    }

    room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
    };
  }, [room]);


  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <VideoQualityProvider>
        <KeyboardShortcuts />
        <ConferenceLayout />
        <RecordingIndicator />
        <DebugMode />
        </VideoQualityProvider>
      </RoomContext.Provider>
    </div>
  );
}
