import React, { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2, X, AlertTriangle, Minimize2, Maximize2, ExternalLink } from 'lucide-react';

interface MeetingRoomProps {
  roomName: string;
  isVideo: boolean;
  onClose: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ roomName, isVideo, onClose }) => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'fullscreen' | 'docked'>('fullscreen');

  const handleDetach = () => {
    const width = 900;
    const height = 650;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      `/huddle/${roomName}?video=${isVideo}`,
      `huddle-${roomName}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no`
    );
    onClose();
  };

  useEffect(() => {
    let active = true;

    async function fetchToken() {
      try {
        setLoading(true);
        setError(null);
        
        let participantName = user?.email || 'Anonymous';
        
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, shield_name')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile) {
            participantName = (profile as any).shield_name || profile.full_name || participantName;
          }
        }

        const { data, error: functionError } = await supabase.functions.invoke('livekit-token', {
          body: {
            room_name: roomName,
            participant_name: participantName
          }
        });

        if (functionError) throw functionError;
        console.log('livekit-token response data:', data);
        if (data?.error) throw new Error(data.error);
        if (!data?.token) throw new Error('No token returned from server');

        if (active) {
          setToken(data.token);
        }
      } catch (err: any) {
        console.error('Error fetching LiveKit token:', err);
        if (active) {
          setError(err.message || 'Failed to fetch huddle token');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchToken();

    return () => {
      active = false;
    };
  }, [roomName, user]);

  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://genieflowai-blq7orkr.livekit.cloud';

  return (
    <div 
      className={
        layout === 'docked' 
          ? "fixed bottom-6 right-6 w-96 h-[480px] z-50 flex flex-col bg-slate-950 text-white border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
          : "fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-200"
      }
    >
      {/* Header */}
      <div className={`px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 shrink-0 ${layout === 'docked' ? 'h-12' : 'h-16'}`}>
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold tracking-wide">
            {layout === 'docked' ? 'Huddle' : `Live Huddle: ${roomName.substring(0, 8)}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {window.name !== `huddle-${roomName}` && (
            <button
              onClick={handleDetach}
              title="Detach to separate window"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}

          {window.name !== `huddle-${roomName}` && (
            layout === 'fullscreen' ? (
              <button
                onClick={() => setLayout('docked')}
                title="Minimize to corner"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setLayout('fullscreen')}
                title="Maximize to fullscreen"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )
          )}

          <button
            onClick={onClose}
            title="Leave Huddle"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Securing sovereign WebRTC channel...</p>
          </div>
        ) : error ? (
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Connection Failed</h3>
            <p className="text-xs text-slate-450 leading-relaxed">{error}</p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors text-slate-200"
              >
                Close Huddle
              </button>
            </div>
          </div>
        ) : (
          token && (
            <LiveKitRoom
              video={isVideo}
              audio={true}
              token={token}
              serverUrl={serverUrl}
              connect={true}
              onDisconnected={onClose}
              data-lk-theme="default"
              className="h-full w-full"
            >
              <VideoConference />
            </LiveKitRoom>
          )
        )}
      </div>
    </div>
  );
};
