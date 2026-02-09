'use client';

import {
  DisconnectButton,
  LeaveIcon,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoQualityToggle } from './VideoQualityToggle';

export function CustomControlBar() {
  return (
    <div className="custom-control-bar">
      <TrackToggle title='Camera' source={Track.Source.Camera} >
        Camera
      </TrackToggle>
      <TrackToggle title='Microphone' source={Track.Source.Microphone} >Microphone</TrackToggle>
      <VideoQualityToggle />
      <DisconnectButton>
        <LeaveIcon />
        <span>Leave</span>
      </DisconnectButton>
    </div>
  );
}
