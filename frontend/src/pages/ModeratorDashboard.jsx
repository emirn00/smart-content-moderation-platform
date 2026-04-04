import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, LayoutDashboard, History, MessageSquare, Image as ImageIcon } from 'lucide-react';
import ModerationService from '../services/moderation.service';
import './ModeratorDashboard.css';

const ModeratorDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ queue: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'queue') {
        const data = await ModerationService.getQueue();
        setItems(data.queue || []);
        setStats(prev => ({ ...prev, queue: data.count || 0 }));
      } else {
        const data = await ModerationService.getAllHistory();
        const historyItems = data.history || [];
        setItems(historyItems);
        setStats(prev => ({
          ...prev,
          approved: historyItems.filter(i => i.status === 'APPROVED').length,
          rejected: historyItems.filter(i => i.status === 'REJECTED').length
        }));
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (contentId, action) => {
    try {
      await ModerationService.takeAction(contentId, action);
      // Refresh data
      fetchData();
    } catch (error) {
      console.error(`Error taking action ${action}:`, error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="status-badge badge-approved"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED': return <span className="status-badge badge-rejected"><XCircle size={12} /> Rejected</span>;
      case 'FLAGGED': return <span className="status-badge badge-flagged"><AlertTriangle size={12} /> Flagged</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const getToxicityColor = (score) => {
    if (score > 0.7) return '#ef4444'; // red
    if (score > 0.4) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title">
          <div className="header-icon shadow-premium">
            <Shield size={24} />
          </div>
          <div>
            <h1>Moderator Dashboard</h1>
            <p className="subtitle">Analyze and manage smart content moderation system.</p>
          </div>
        </div>
        <button className="refresh-btn nav-item-cta" onClick={fetchData} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card queue-stat">
          <div className="stat-info">
            <span className="stat-label">Pending Review</span>
            <span className="stat-value">{stats.queue}</span>
          </div>
          <div className="stat-icon-bg">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="stat-card approved-stat">
          <div className="stat-info">
            <span className="stat-label">Total Approved</span>
            <span className="stat-value">{stats.approved}</span>
          </div>
          <div className="stat-icon-bg">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="stat-card rejected-stat">
          <div className="stat-info">
            <span className="stat-label">Total Rejected</span>
            <span className="stat-value">{stats.rejected}</span>
          </div>
          <div className="stat-icon-bg">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <LayoutDashboard size={18} />
          <span>Queue (Flagged)</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          <span>All History</span>
        </button>
      </div>

      <div className="content-grid">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" size={32} />
            <p>Loading records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state shadow-premium">
            <Clock size={48} />
            <h3>No items found</h3>
            <p>{activeTab === 'queue' ? 'Great job! The queue is empty.' : 'No history found yet.'}</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="content-card shadow-premium fade-in">
              <div className="card-header">
                <div className="user-info">
                  <div className="avatar-small">
                    {item.user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div>
                    <span className="user-email">{item.user?.email}</span>
                    <span className="post-date">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <div className="card-body">
                <div className="content-preview">
                  {item.type === 'TEXT' ? (
                    <div className="text-content">
                      <MessageSquare size={16} className="type-icon" />
                      <p>{item.body}</p>
                    </div>
                  ) : (
                    <div className="image-placeholder">
                      <ImageIcon size={32} />
                      <p className="filename-text">{item.filename}</p>
                      <span className="mime-type-tag">{item.mimeType}</span>
                    </div>
                  )}
                </div>

                {item.aiAnalysisResult && (
                  <div className="ai-report glass-panel">
                    <div className="ai-header">
                      <span className="ai-label">AI Analysis Report</span>
                      <span className="ai-verdict-badge">{item.aiAnalysisResult.verdict}</span>
                    </div>
                    <div className="toxicity-meter">
                      <div className="meter-header">
                        <span>Toxicity Score</span>
                        <span className="toxicity-val" style={{ color: getToxicityColor(item.aiAnalysisResult.toxicityScore) }}>
                          {(item.aiAnalysisResult.toxicityScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="meter-bar-container">
                        <div 
                          className="meter-bar-fill" 
                          style={{ 
                            width: `${item.aiAnalysisResult.toxicityScore * 100}%`,
                            backgroundColor: getToxicityColor(item.aiAnalysisResult.toxicityScore)
                          }}
                        ></div>
                      </div>
                    </div>
                    {item.aiAnalysisResult.detectedCategories?.length > 0 && (
                      <div className="categories-list">
                        {item.aiAnalysisResult.detectedCategories.map(cat => (
                          <span key={cat} className="category-pill">{cat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {item.status === 'FLAGGED' && (
                <div className="card-actions-row">
                  <button 
                    className="moderation-btn btn-reject-action"
                    onClick={() => handleAction(item.id, 'REJECT')}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button 
                    className="moderation-btn btn-approve-action"
                    onClick={() => handleAction(item.id, 'APPROVE')}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;
