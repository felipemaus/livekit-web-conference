'use client';

import {
  DisconnectButton,
  GearIcon,
  LeaveIcon,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoQualityToggle } from './VideoQualityToggle';
import { useState } from 'react';

export function CustomControlBar() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={`custom-control-bar ${
        collapsed ? 'collapsed' : 'expanded'
      }`}
    >
      {/* Botão de toggle – só aparece no mobile */}
      <button
        className="control-bar-toggle"
        onClick={() => setCollapsed(v => !v)}
      >
        {collapsed ? <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 8 }}><GearIcon /> Open Control Bar</div> : 
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 8 }}><GearIcon /> Close Control Bar</div>}
      </button>

      <div className="control-bar-content">
        <TrackToggle title="Camera" source={Track.Source.Camera}>
          Camera
        </TrackToggle>

        <TrackToggle title="Microphone" source={Track.Source.Microphone}>
          Microphone
        </TrackToggle>

        <VideoQualityToggle />

        <DisconnectButton>
          <LeaveIcon />
          <span>Leave</span>
        </DisconnectButton>
      </div>
    </div>
  );
}
