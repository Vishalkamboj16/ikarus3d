const rooms = {};

// Create a new room and make the creator the admin
const createRoom = (roomId, adminSocketId, adminUser) => {
  rooms[roomId] = {
    admin: adminSocketId,
    participants: { [adminSocketId]: adminUser },
    pending: {},
  };
};

// Get room by ID
const getRoom = (roomId) => rooms[roomId];

// Add a user to the lobby (pending approval)
const addUserToLobby = (roomId, socketId, user) => {
  if (rooms[roomId]) {
    rooms[roomId].pending[socketId] = user;
    return true;
  }
  return false;
};

// Admit a user from lobby into the room
const admitUserToRoom = (roomId, socketId) => {
  const room = rooms[roomId];
  if (room && room.pending[socketId]) {
    const user = room.pending[socketId];
    delete room.pending[socketId];
    room.participants[socketId] = user;
    return user;
  }
  return null;
};

// Remove a user from any room (used on disconnect)
const removeUser = (socketId) => {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const wasAdmin = room.admin === socketId;

    if (room.participants[socketId] || room.pending[socketId]) {
      delete room.participants[socketId];
      delete room.pending[socketId];

      // If admin left or no participants left, delete the room
      if (wasAdmin || Object.keys(room.participants).length === 0) {
        delete rooms[roomId];
        return { roomId, wasAdmin, roomDeleted: true };
      }

      return { roomId, wasAdmin, roomDeleted: false };
    }
  }

  return { roomId: null, wasAdmin: false, roomDeleted: false };
};

// Kick a specific user from a room
const kickUser = (roomId, socketIdToKick) => {
  if (rooms[roomId] && rooms[roomId].participants[socketIdToKick]) {
    delete rooms[roomId].participants[socketIdToKick];
    return true;
  }
  return false;
};

// Get a list of participants in a room
const getParticipants = (roomId) => {
  if (rooms[roomId]) {
    return Object.entries(rooms[roomId].participants).map(([socketId, user]) => ({
      ...(user.toObject ? user.toObject() : user), // support both plain object and Mongoose doc
      socketId,
    }));
  }
  return [];
};

// Update the admin's socket ID (for reconnects/refresh)
const updateAdminSocket = (roomId, newSocketId, adminUser) => {
  const room = rooms[roomId];
  if (room) {
    delete room.participants[room.admin];
    room.admin = newSocketId;
    room.participants[newSocketId] = adminUser;
  }
};

// Optional: get rooms a socket is part of (for disconnect handling)
const getRoomsBySocket = (socketId) => {
  return Object.entries(rooms)
    .filter(([_, room]) => room.participants[socketId] || room.pending[socketId])
    .map(([roomId, _]) => roomId);
};

module.exports = {
  createRoom,
  getRoom,
  addUserToLobby,
  admitUserToRoom,
  removeUser,
  kickUser,
  getParticipants,
  updateAdminSocket,
  getRoomsBySocket,
};
