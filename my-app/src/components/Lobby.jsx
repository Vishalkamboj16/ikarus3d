import React from 'react';

const Lobby = ({ pendingUsers, onAdmit }) => {
  if (!pendingUsers || pendingUsers.length === 0) return null;

  return (
    <div className="absolute top-5 right-5 z-10 bg-yellow-100 text-black p-4 rounded-lg shadow-lg max-w-sm">
      <h4 className="font-bold mb-2">Waiting Room</h4>
      {pendingUsers.map(({ socketId, user }) => (
        <div key={socketId} className="flex justify-between items-center mb-1">
          <span className="text-sm">{user.displayName} wants to join</span>
          <button onClick={() => onAdmit(socketId)} className="bg-green-600 text-white px-2 py-1 text-xs rounded ml-2">
            Admit
          </button>
        </div>
      ))}
    </div>
  );
};

export default Lobby;