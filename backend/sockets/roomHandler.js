const RoomManager = require('../services/RoomManager');

module.exports = (io, socket) => {
  
  const joinRoom = ({ roomId }) => {
    if (!socket.user) {
      return socket.emit('auth-error', { message: 'You must be logged in.' });
    }

    let room = RoomManager.getRoom(roomId);

    // Case 1: Room doesn't exist -> create it and make this user admin
    if (!room) {
      RoomManager.createRoom(roomId, socket.id, socket.user);
      socket.join(roomId);
      socket.emit('join-approved', { isAdmin: true, requiresApproval: false });
      io.to(roomId).emit('update-participant-list', RoomManager.getParticipants(roomId));
      return;
    }

    // Case 2: Room exists -> check if user is the admin (refresh scenario)
    const adminSocketId = room.admin;
    const adminUser = room.participants[adminSocketId];

    if (adminUser && adminUser.googleId === socket.user.googleId) {
      RoomManager.updateAdminSocket(roomId, socket.id, socket.user);
      socket.join(roomId);
      socket.emit('join-approved', { isAdmin: true, requiresApproval: false });
      io.to(roomId).emit('update-participant-list', RoomManager.getParticipants(roomId));
      return;
    }

    // Case 3: New user joining existing room -> lobby
    RoomManager.addUserToLobby(roomId, socket.id, socket.user);
    io.to(room.admin).emit('user-requesting-join', {
      socketId: socket.id,
      user: socket.user,
    });
    socket.emit('join-approved', { isAdmin: false, requiresApproval: true });
  };

  const admitUser = ({ roomId, socketIdToAdmit }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room || room.admin !== socket.id) return;

    const user = RoomManager.admitUserToRoom(roomId, socketIdToAdmit);
    if (!user) return;

    const socketToAdmit = io.sockets.sockets.get(socketIdToAdmit);
    if (!socketToAdmit) return;

    socketToAdmit.join(roomId);
    socketToAdmit.emit('join-approved', { isAdmin: false, requiresApproval: false });

    // Notify room and update participant list
    socket.to(roomId).emit('user-joined', { peerId: socketIdToAdmit, user });
    io.to(roomId).emit('update-participant-list', RoomManager.getParticipants(roomId));
  };

  const kickUser = ({ roomId, socketIdToKick }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room || room.admin !== socket.id) return;

    const success = RoomManager.kickUser(roomId, socketIdToKick);
    if (!success) return;

    const socketToKick = io.sockets.sockets.get(socketIdToKick);
    if (socketToKick) {
      socketToKick.emit('you-were-kicked');
      socketToKick.leave(roomId);
    }

    io.to(roomId).emit('user-disconnected', { peerId: socketIdToKick });
    io.to(roomId).emit('update-participant-list', RoomManager.getParticipants(roomId));
  };

  // Register event listeners
  socket.on('join-room', joinRoom);
  socket.on('admit-user', admitUser);
  socket.on('kick-user', kickUser);

  // BUG FIX: The incorrect and redundant 'disconnect' handler has been removed.
  // The primary handler in socketManager.js will now manage all disconnects.
};