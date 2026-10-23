import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MeetingRoom } from '../features/teams/components/MeetingRoom';

export const DetachedHuddle: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const isVideo = searchParams.get('video') === 'true';

  if (!roomName) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-medium">
        No room specified
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950">
      <MeetingRoom
        roomName={roomName}
        isVideo={isVideo}
        onClose={() => window.close()}
      />
    </div>
  );
};

export default DetachedHuddle;
