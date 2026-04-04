import { Link, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-logo">SCM Platform</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link 
            to="/login" 
            className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}
          >
            <LogIn size={18} />
            <span>Login</span>
          </Link>
          <Link 
            to="/register" 
            className={`nav-item ${location.pathname === '/register' ? 'active' : ''}`}
          >
            <UserPlus size={18} />
            <span>Register</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
