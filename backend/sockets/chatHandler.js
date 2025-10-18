module.exports = (io, socket) => {
  const sendMessage = ({ roomId, message }) => {
    if (socket.user) {
      io.to(roomId).emit('receive-message', {
        message,
        senderName: socket.user.displayName,
        id: socket.id,
      });
    }
  };

  socket.on('send-message', sendMessage);
};