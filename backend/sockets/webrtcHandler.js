module.exports = (io, socket) => {
  // A peer is sending an offer to a specific target peer
  const sendOffer = (payload) => {
    io.to(payload.to).emit('offer', { from: socket.id, offer: payload.offer });
  };

  // A peer is sending an answer back to the offering peer
  const sendAnswer = (payload) => {
    io.to(payload.to).emit('answer', { from: socket.id, answer: payload.answer });
  };

  // A peer is sending network connection candidates
  const sendIceCandidate = (payload) => {
    io.to(payload.to).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
  };

  socket.on('offer', sendOffer);
  socket.on('answer', sendAnswer);
  socket.on('ice-candidate', sendIceCandidate);
};