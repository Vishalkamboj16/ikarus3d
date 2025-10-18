import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream, isLocal }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Mute local video to prevent echo
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default VideoPlayer;