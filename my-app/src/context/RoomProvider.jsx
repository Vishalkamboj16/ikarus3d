import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';

export const RoomContext = createContext(null);
export const useRoom = () => useContext(RoomContext);

const RoomProvider = ({ children }) => {
  const { roomId } = useParams();

  // State
  const [participants, setParticipants] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [joinStatus, setJoinStatus] = useState('connecting');
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pinnedStream, setPinnedStream] = useState(null); // Added for the UI

  // Refs
  const localCameraTrackRef = useRef(null);
  const peerConnections = useRef({});

  // Utility: Create PeerConnection (placeholder)
  const createPeerConnection = (socketId) => {
    // This is a placeholder. A full implementation would involve ICE/SDP exchange.
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    });

    localStream?.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [socketId]: event.streams[0],
      }));
    };
    
    // Add ICE candidate logic, offer/answer logic here...

    peerConnections.current[socketId] = pc;
    return pc;
  };

  // Admit / Kick / Toggle functions
  const admitUser = (socketId) => socket.emit('admit-user', { roomId, socketIdToAdmit: socketId });
  const kickUser = (socketId) => socket.emit('kick-user', { roomId, socketIdToKick: socketId });

  const toggleMute = () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    }
  };

  const toggleCamera = () => {
    if (localStream && !isScreenSharing) { // Prevent turning off screen share with this button
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOff(!videoTrack.enabled);
        }
    }
  };

  /**
   * CORRECTED SCREEN SHARING LOGIC
   * This function handles both starting and stopping the screen share.
   */
  const shareScreen = async () => {
    // --- STOP SCREEN SHARING ---
    if (isScreenSharing) {
      const cameraTrack = localCameraTrackRef.current;
      if (!cameraTrack) {
        console.error("Original camera track not found to switch back to.");
        return;
      }

      // Stop the screen sharing track
      localStream.getVideoTracks()[0].stop();

      // Replace the screen track with the camera track for all peers
      for (const pc of Object.values(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }
      }

      // Update the local stream
      const newStream = new MediaStream([ ...localStream.getAudioTracks(), cameraTrack ]);
      setLocalStream(newStream);
      setIsScreenSharing(false);
      return;
    }

    // --- START SCREEN SHARING ---
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true // Prompt for audio capture as well
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;

      // When the user clicks the browser's native "Stop sharing" button
      screenTrack.onended = () => {
        // The `if (isScreenSharing)` block above will handle the logic
        shareScreen(); 
      };

      // Replace the camera track with the screen track for all peers
      for (const pc of Object.values(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }
      }

      // Update the local stream
      const newStream = new MediaStream([ ...localStream.getAudioTracks(), screenTrack ]);
      setLocalStream(newStream);
      setIsScreenSharing(true);
      
    } catch (error) {
      console.error('Could not start screen share:', error);
    }
  };

  // Setup local media
  useEffect(() => {
    let streamRef = null;
    const getLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localCameraTrackRef.current = stream.getVideoTracks()[0]; // Save the original camera track
        streamRef = stream;
      } catch (err) {
        console.error('Error getting media devices:', err);
        setErrorMessage('Could not access your camera or microphone. Please check permissions and refresh the page.');
        setJoinStatus('error');
      }
    };
    getLocalStream();

    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  // Socket event management
  useEffect(() => {
    if (!localStream) return; // Wait for local stream before connecting

    const onConnect = () => socket.emit('join-room', { roomId });
    const onAuthError = ({ message }) => {
      setErrorMessage(`Authentication Error: ${message}.`);
      setJoinStatus('error');
    };
    const onJoinApproved = ({ isAdmin: isHost, requiresApproval }) => {
      setIsAdmin(isHost);
      setJoinStatus(requiresApproval ? 'pending' : 'joined');
    };
    const onUserRequestingJoin = (request) => setPendingUsers(prev => [...prev, request]);
    const onRoomClosed = () => {
      setJoinStatus('closed');
      localStream?.getTracks().forEach(track => track.stop());
      socket.disconnect();
    };
    
    // Add a new user and create a peer connection
    const onNewUser = (data) => {
        const { socketId } = data;
        createPeerConnection(socketId);
        // Here you would typically initiate the offer/answer exchange
    };

    socket.on('connect', onConnect);
    socket.on('auth-error', onAuthError);
    socket.on('join-approved', onJoinApproved);
    socket.on('user-requesting-join', onUserRequestingJoin);
    socket.on('update-participant-list', setParticipants);
    socket.on('room-closed', onRoomClosed);
    socket.on('new-user', onNewUser); // Example for handling new users

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('auth-error', onAuthError);
      socket.off('join-approved', onJoinApproved);
      socket.off('user-requesting-join', onUserRequestingJoin);
      socket.off('update-participant-list');
      socket.off('room-closed', onRoomClosed);
      socket.off('new-user');
      socket.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [roomId, localStream]);

  return (
    <RoomContext.Provider
      value={{
        participants,
        pendingUsers,
        remoteStreams,
        joinStatus,
        localStream,
        isMuted,
        isCameraOff,
        isScreenSharing,
        isAdmin,
        errorMessage,
        pinnedStream,
        setPinnedStream,
        admitUser,
        kickUser,
        toggleMute,
        toggleCamera,
        shareScreen,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;