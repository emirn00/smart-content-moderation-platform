import SubmitContent from '../components/SubmitContent';
import './Home.css';

function Home() {
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

      <div className="home-content">
        <SubmitContent />
      </div>
    </div>
  );
}

export default Home;
