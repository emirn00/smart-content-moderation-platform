import { useState } from 'react';
import { UploadCloud, History } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import SubmitContent from '../components/SubmitContent';
import MySubmissions from '../components/MySubmissions';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('submit');

  if (isAuthenticated && user?.role === 'MODERATOR') {
    return <Navigate to="/moderator" replace />;
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-badge">AI-Powered Moderation</div>
        <h1>Smart Content Moderation Platform</h1>
        <p className="hero-subtitle">
          Submit text or images for AI-based toxicity analysis. Content is automatically
          classified and routed to moderators when needed.
        </p>
      </div>

      {isAuthenticated && (
        <div className="home-tabs fade-in">
          <button 
            className={`home-tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            <UploadCloud size={18} />
            <span>Submit Content</span>
          </button>
          <button 
            className={`home-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            <span>My Submissions</span>
          </button>
        </div>
      )}

      <div className="home-content">
        {(!isAuthenticated || activeTab === 'submit') ? (
          <SubmitContent />
        ) : (
          <MySubmissions />
        )}
      </div>
    </div>
  );
}

export default Home;
