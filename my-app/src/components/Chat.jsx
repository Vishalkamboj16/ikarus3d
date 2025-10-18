import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState(`User-${Math.floor(Math.random() * 1000)}`); // Simple username
  const { roomId } = useParams();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit('send-message', { roomId, message: newMessage, senderName: username });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Chat</h3>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.id === socket.id ? 'text-right' : 'text-left'}`}>
             <div className={`inline-block p-2 rounded-lg ${msg.id === socket.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <p className="text-sm font-bold">{msg.senderName}</p>
                <p>{msg.message}</p>
             </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow bg-gray-700 text-white rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;