import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, logout } = useAuth();

  // This effect handles redirecting the user back to their desired room after login
  useEffect(() => {
    // Get the path the user was trying to access before being redirected to login
    const fromPath = location.state?.from?.pathname;

    // If a user is now logged in AND they were redirected from a specific path...
    if (user && fromPath) {
      // ...send them to that path.
      // 'replace: true' prevents the login page from being in the browser history.
      navigate(fromPath, { replace: true });
    }
  }, [user, location, navigate]);


  const createAndJoin = () => {
    const newRoomId = uuidV4();
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId) navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white text-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white p-4">
      <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        IKARUS3D Meet
      </h1>
      <p className="text-gray-400 mb-8">High-quality video meetings, for free.</p>
      <div className="w-full max-w-md p-8 bg-black bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700">
        {user ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg">Welcome, <span className="font-bold">{user.displayName}!</span></p>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-transform transform hover:scale-105"
              >
                Logout
              </button>
            </div>
            <button
              onClick={createAndJoin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg mb-4 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Create New Meeting
            </button>
            <div className="flex items-center my-6">
              <hr className="flex-grow border-t border-gray-700" />
              <span className="px-4 text-gray-500 font-semibold">OR</span>
              <hr className="flex-grow border-t border-gray-700" />
            </div>
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Enter meeting code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg py-3 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <button
                onClick={joinRoom}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
              >
                Join Meeting
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-6 text-gray-300">Please log in to start or join a meeting.</p>
            <button
              onClick={login}
              className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center w-full"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 10.5V13.5H16.5M12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6Z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12H15"></path>
              </svg>
              Login with Google
            </button>
          </div>
        )}
      </div>
      <footer className="mt-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} IKARUS3D. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;