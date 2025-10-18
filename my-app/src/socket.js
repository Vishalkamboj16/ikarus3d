import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';

// Add `withCredentials: true`
const socket = io(URL, {
  withCredentials: true,
  autoConnect: false, // We will connect manually after checking auth
});

export default socket;