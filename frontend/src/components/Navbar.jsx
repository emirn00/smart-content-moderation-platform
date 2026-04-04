import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LogIn, UserPlus, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

          {isAuthenticated ? (
            <>
              <div className="nav-user">
                {user?.role === 'MODERATOR' ? <Shield size={16} /> : <User size={16} />}
                <span className="nav-user-email">{user?.email}</span>
                <span className={`nav-badge ${user?.role === 'MODERATOR' ? 'badge-mod' : 'badge-user'}`}>
                  {user?.role}
                </span>
              </div>
              <button className="nav-item nav-logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link 
                to="/register" 
                className={`nav-item nav-item-cta ${location.pathname === '/register' ? 'active' : ''}`}
              >
                <UserPlus size={18} />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
