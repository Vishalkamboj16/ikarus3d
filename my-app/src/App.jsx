import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import the new component

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/room/:roomId" 
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;