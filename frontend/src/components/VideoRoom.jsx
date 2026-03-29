import React from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function VideoRoom({ token, serverUrl, roomName, onLeave }) {

  return (
    <LiveKitRoom
      video={true} 
      audio={true} 
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onLeave} 
      className="flex flex-col h-full w-full bg-black relative"
      data-lk-theme="default"
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
