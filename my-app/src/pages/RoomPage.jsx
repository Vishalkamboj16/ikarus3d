import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import RoomProvider, { RoomContext } from '../context/RoomProvider';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import ParticipantList from '../components/ParticipantList';
import Lobby from '../components/Lobby';
import socket from '../socket';

const MeetingUI = () => {
  const {
    localStream,
    remoteStreams,
    pinnedStream,
    setPinnedStream,
    isAdmin,
    participants,
    pendingUsers,
    admitUser,
    kickUser,
    isMuted,
    isCameraOff,
    isScreenSharing,
    toggleMute,
    toggleCamera,
    shareScreen,
  } = useContext(RoomContext);

  const { roomId } = useParams();
  const [isCopied, setIsCopied] = useState(false);

  const mainStream = pinnedStream || localStream;
  const allStreams = { local: localStream, ...remoteStreams };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .gradient-border {
          position: relative;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          z-index: -1;
          margin: -2px;
          border-radius: inherit;
          background: linear-gradient(to right, #4f46e5, #9333ea);
        }
      `}</style>
      <div className="relative flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden p-4 gap-4">
        {/* --- Meeting Info Bar --- */}
        <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-xl border border-slate-700/50 p-3 px-4 rounded-xl shadow-lg flex items-center gap-4 z-30 animate-float">
          <div>
            <span className="text-xs text-slate-400">Meeting Code</span>
            <p className="font-mono text-sm text-slate-200 select-all">{roomId}</p>
          </div>
          <button
            onClick={copyMeetingLink}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-md"
          >
            {isCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* --- Lobby for Admin --- */}
        {isAdmin && (
          <Lobby
            pendingUsers={pendingUsers}
            onAdmit={admitUser}
          />
        )}

        {/* --- Main Meeting Section --- */}
        <div className="flex flex-col flex-grow rounded-2xl bg-black/20 backdrop-blur-xl border border-slate-800/60 overflow-hidden shadow-2xl">
          {/* --- Main Video --- */}
          <div className="relative flex-grow bg-black/50 rounded-lg overflow-hidden ring-1 ring-white/10">
            {mainStream && (
              <VideoPlayer
                stream={mainStream}
                isLocal={mainStream === localStream}
              />
            )}
            {pinnedStream && (
              <button
                onClick={() => setPinnedStream(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1 text-xs rounded-full z-20 transition-transform transform hover:scale-105"
              >
                Unpin
              </button>
            )}
          </div>

          {/* --- Thumbnails Strip --- */}
          <div className="flex justify-center p-3 mt-2 space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {Object.entries(allStreams).map(([id, stream]) => {
              if (!stream || stream === mainStream) return null;
              const isPinned = stream === pinnedStream;
              return (
                <div
                  key={id}
                  className={`relative w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 group shadow-lg ${isPinned ? 'ring-4 ring-indigo-500' : 'ring-2 ring-transparent hover:ring-indigo-500'}`}
                  onClick={() => setPinnedStream(stream)}
                >
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="text-xs font-bold tracking-wider">PIN</span>
                  </div>
                  <VideoPlayer stream={stream} isLocal={false} />
                </div>
              );
            })}
          </div>

          {/* --- Control Bar --- */}
          <div className="bg-black/30 border-t border-slate-700/50 p-4 mt-auto rounded-t-xl flex justify-center items-center gap-4 shadow-lg backdrop-blur-xl">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className={`p-3 rounded-full transition-all shadow-md transform hover:scale-110 ${
                isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="text-2xl">{isMuted ? '🔇' : '🎤'}</span>
            </button>

            <button
              onClick={toggleCamera}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`p-3 rounded-full transition-all shadow-md transform hover:scale-110 ${
                isCameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="text-2xl">{isCameraOff ? '📷' : '📸'}</span>
            </button>

            <button
              onClick={shareScreen}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              className={`p-3 rounded-full transition-all shadow-md transform hover:scale-110 ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              <span className="text-2xl">{isScreenSharing ? '🛑' : '🖥️'}</span>
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              title="End Call"
              className="p-3 bg-red-700 hover:bg-red-600 rounded-full shadow-lg transform hover:scale-110 transition-all"
            >
              <span className="text-2xl">🚪</span>
            </button>
          </div>
        </div>

        {/* --- Sidebar (Participants + Chat) --- */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="flex-1 bg-black/20 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800/60 overflow-hidden">
            <ParticipantList
              participants={participants}
              isAdmin={isAdmin}
              onKick={kickUser}
              selfSocketId={socket.id}
            />
          </div>
          <div className="flex-1 bg-black/20 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-800/60 overflow-hidden">
            <Chat />
          </div>
        </div>
      </div>
    </>
  );
};

/* -------- Room State UI -------- */
const RoomContent = () => {
    const { joinStatus, localStream, errorMessage } = useContext(RoomContext);

    const commonLayoutClasses = "flex flex-col items-center justify-center h-screen text-center text-white bg-gradient-to-br from-slate-900 to-indigo-950 p-4";

    switch (joinStatus) {
        case 'pending':
            return (
                <div className={commonLayoutClasses}>
                    <h2 className="text-4xl font-bold mb-3 animate-pulse">Waiting for Host to Admit You...</h2>
                    <p className="text-slate-400 mb-6">Your camera and microphone are ready.</p>
                    <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl bg-black border-2 border-slate-700">
                        {localStream && <VideoPlayer stream={localStream} isLocal />}
                    </div>
                </div>
            );
        case 'joined':
            return <MeetingUI />;
        case 'kicked':
            return <div className={`${commonLayoutClasses} text-red-500`}><h2 className="text-3xl font-bold">You were removed from the meeting.</h2></div>;
        case 'closed':
            return <div className={`${commonLayoutClasses} text-slate-300`}><h2 className="text-3xl font-bold">The host ended the meeting.</h2></div>;
        case 'error':
            return (
                <div className={commonLayoutClasses}>
                    <h2 className="text-4xl font-bold text-red-500 mb-4">Connection Error</h2>
                    <p className="text-slate-400 mb-8 max-w-md">{errorMessage}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform"
                    >
                        Try Again
                    </button>
                </div>
            );
        default:
            return (
                <div className={commonLayoutClasses}>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                    <h2 className="text-2xl text-slate-300">Connecting...</h2>
                </div>
            );
    }
};

const RoomPage = () => (
    <RoomProvider>
        <RoomContent />
    </RoomProvider>
);

export default RoomPage;