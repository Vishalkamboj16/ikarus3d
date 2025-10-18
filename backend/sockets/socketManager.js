const registerRoomHandlers = require('./roomHandler');
const registerWebrtcHandlers = require('./webrtcHandler');
const registerChatHandlers = require('./chatHandler');
const RoomManager = require('../services/RoomManager');
const passport = require('passport'); // Import passport

const initializeSocketManager = (io, sessionMiddleware) => {
  // Helper to make Express middleware compatible with Socket.IO
  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

  // Apply the full authentication middleware chain to each socket connection
  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session())); // This is the crucial step

  // After authentication, attach the user object to the socket itself for easy access
  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      next();
    } else {
      // Allow connection but log that it's an unauthenticated user
      console.log(`Socket ${socket.id} connected as a guest.`);
      next();
    }
  });

  io.on('connection', (socket) => {
    // Now, socket.user will be populated if the user was logged in
    console.log(`User connected: ${socket.id}, Name: ${socket.user?.displayName || 'Guest'}`);

    // Register all event handlers for this socket
    registerRoomHandlers(io, socket);
    registerWebrtcHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // This is the single source of truth for disconnect logic
      const { roomId, roomDeleted } = RoomManager.removeUser(socket.id);

      if (roomId) {
        if (roomDeleted) {
            console.log(`Admin left or room is empty. Room ${roomId} deleted.`);
            io.to(roomId).emit('room-closed');
        } else {
            // A participant or pending user left, but the room persists.
            socket.to(roomId).emit('user-disconnected', { peerId: socket.id });
            io.to(roomId).emit('update-participant-list', RoomManager.getParticipants(roomId));
            
            // Also notify the admin if the pending user list has changed
            const room = RoomManager.getRoom(roomId);
            if (room && room.admin) {
                // To be robust, we need to get pending users from the room state
                const pendingUsersList = Object.entries(room.pending).map(([socketId, user]) => ({ socketId, user }));
                io.to(room.admin).emit('update-pending-users', pendingUsersList);
            }
        }
      }
    });
  });
};

module.exports = initializeSocketManager;