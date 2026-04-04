import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ModeratorDashboard from './pages/ModeratorDashboard';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <div className="main-layout">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
