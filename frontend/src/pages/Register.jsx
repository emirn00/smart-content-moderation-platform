import { useState } from 'react';
import { Mail, Lock, UserPlus, Shield, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        email,
        password,
        role
      });
      console.log('Registration successful:', response.data);
      // Automatically log them in by saving token and redirecting
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      console.error('Register attempt failed:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the platform and choose your role</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="error-message" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                className="auth-input"
                placeholder="emir@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <div className="role-selector">
              <label className="role-option">
                <input 
                  type="radio" 
                  name="role" 
                  value="USER" 
                  checked={role === 'USER'} 
                  onChange={(e) => setRole(e.target.value)} 
                />
                <div className="role-card">
                  <User size={24} className="role-icon" />
                  <span>Standard User</span>
                </div>
              </label>

              <label className="role-option">
                <input 
                  type="radio" 
                  name="role" 
                  value="MODERATOR" 
                  checked={role === 'MODERATOR'} 
                  onChange={(e) => setRole(e.target.value)} 
                />
                <div className="role-card">
                  <Shield size={24} className="role-icon" />
                  <span>Moderator</span>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating...' : <>Register <UserPlus size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
