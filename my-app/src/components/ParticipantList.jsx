import React from 'react';

const ParticipantList = ({ participants, isAdmin, onKick, selfSocketId }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
        Participants ({participants.length})
      </h3>
      <ul className="flex-grow overflow-y-auto">
        {participants.map((p) => (
          <li key={p.socketId} className="flex justify-between items-center py-2">
            <span className="text-white">{p.displayName} {p.socketId === selfSocketId ? "(You)" : ""}</span>
            {isAdmin && p.socketId !== selfSocketId && (
              <button
                onClick={() => onKick(p.socketId)}
                className="bg-red-600 text-white px-2 py-1 text-xs rounded"
              >
                Kick
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;