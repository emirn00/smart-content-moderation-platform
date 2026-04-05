import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, 
  LayoutDashboard, History, MessageSquare, Image as ImageIcon,
  ChevronLeft, ChevronRight, Eye, Filter, MoreHorizontal, X
} from 'lucide-react';
import ModerationService from '../services/moderation.service';
import './ModeratorDashboard.css';

const ModeratorDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null); // For detail modal
  const [stats, setStats] = useState({ queue: 0, approved: 0, rejected: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        status: activeTab === 'queue' ? 'FLAGGED' : statusFilter
      };

      let result;
      if (activeTab === 'queue') {
        result = await ModerationService.getQueue(params);
        setItems(result.queue || []);
        setStats(prev => ({ ...prev, queue: result.totalCount || 0 }));
      } else {
        result = await ModerationService.getAllHistory(params);
        setItems(result.history || []);
        // Update stats summary (could also fetch these separately if needed)
        // For simplicity, we'll use the total count from the history API if filtering by status
        if (statusFilter === 'APPROVED') setStats(prev => ({ ...prev, approved: result.totalCount }));
        if (statusFilter === 'REJECTED') setStats(prev => ({ ...prev, rejected: result.totalCount }));
      }

      setPagination(prev => ({
        ...prev,
        totalCount: result.totalCount || 0,
        totalPages: result.totalPages || 1
      }));
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.currentPage, pagination.limit, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (contentId, action) => {
    try {
      await ModerationService.takeAction(contentId, action);
      if (selectedItem && selectedItem.id === contentId) {
        setSelectedItem(null);
      }
      fetchData();
    } catch (error) {
      console.error(`Error taking action ${action}:`, error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setStatusFilter('ALL');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="status-pill status-approved"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED': return <span className="status-pill status-rejected"><XCircle size={12} /> Rejected</span>;
      case 'FLAGGED': return <span className="status-pill status-flagged"><AlertTriangle size={12} /> Flagged</span>;
      case 'PENDING': return <span className="status-pill status-pending"><Clock size={12} /> Pending</span>;
      default: return <span className="status-pill">{status}</span>;
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

      <div className="dashboard-main-card shadow-premium">
        <div className="table-controls">
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => handleTabChange('queue')}
            >
              <LayoutDashboard size={18} />
              <span>Queue (Flagged)</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => handleTabChange('history')}
            >
              <History size={18} />
              <span>All History</span>
            </button>
          </div>

          {activeTab === 'history' && (
            <div className="filter-group">
              <Filter size={16} className="filter-icon" />
              <select 
                className="status-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending (Draft/Flagged)</option>
                <option value="APPROVED">Approved Only</option>
                <option value="REJECTED">Rejected Only</option>
              </select>
            </div>
          )}
        </div>

        <div className="table-responsive">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>Content Preview</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th>AI Verdict</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-loading">
                    <RefreshCw className="spinning" size={24} />
                    <span>Loading...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    <Clock size={32} />
                    <p>No items found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="table-row-clickable" onClick={() => setSelectedItem(item)}>
                    <td>
                      <div className="content-preview-cell">
                        {item.type === 'TEXT' ? (
                          <span className="text-truncate">{item.body}</span>
                        ) : (
                          <div className="img-thumb-mini">
                            <ImageIcon size={14} />
                            <span>{item.filename}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td><span className="type-tag">{item.type}</span></td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-micro">{item.user?.email?.[0].toUpperCase()}</div>
                        <span>{item.user?.email}</span>
                      </div>
                    </td>
                    <td className="date-cell">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>
                      {item.aiAnalysisResult ? (
                        <div className="ai-score-cell">
                          <div 
                            className="score-dot" 
                            style={{ backgroundColor: getToxicityColor(item.aiAnalysisResult.toxicityScore) }}
                          ></div>
                          <span>{item.aiAnalysisResult.verdict}</span>
                        </div>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons-cell">
                        <button className="icon-action-btn" title="View Details" onClick={() => setSelectedItem(item)}>
                          <Eye size={16} />
                        </button>
                        {item.status === 'FLAGGED' && (
                          <>
                            <button 
                              className="icon-action-btn btn-reject" 
                              title="Reject"
                              onClick={() => handleAction(item.id, 'REJECT')}
                            >
                              <XCircle size={16} />
                            </button>
                            <button 
                              className="icon-action-btn btn-approve" 
                              title="Approve"
                              onClick={() => handleAction(item.id, 'APPROVE')}
                            >
                              <CheckCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-footer">
          <div className="pagination-info">
            Showing 1-{items.length} of {pagination.totalCount} items
          </div>
          <div className="pagination-controls">
            <button 
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="page-btn"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="current-page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button 
              disabled={pagination.currentPage === pagination.totalPages || loading}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="page-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedItem && (
        <div className="modal-overlay fade-in" onClick={() => setSelectedItem(null)}>
          <div className="modal-content glass-panel shadow-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Content Detail</h3>
              <button className="close-modal" onClick={() => setSelectedItem(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Status</label>
                    <div>{getStatusBadge(selectedItem.status)}</div>
                  </div>
                  <div className="detail-item">
                    <label>Submitted By</label>
                    <div className="user-info-large">
                      <div className="avatar-small">{selectedItem.user?.email?.[0].toUpperCase()}</div>
                      <span>{selectedItem.user?.email}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Date</label>
                    <div className="text-muted">{new Date(selectedItem.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="content-display-box">
                <label>Content</label>
                {selectedItem.type === 'TEXT' ? (
                  <div className="full-text-content glass-panel">
                    <MessageSquare size={18} />
                    <p>{selectedItem.body}</p>
                  </div>
                ) : (
                  <div className="full-image-preview glass-panel">
                    <ImageIcon size={48} />
                    <p>{selectedItem.filename}</p>
                    <div className="image-meta">
                      <span>MIME: {selectedItem.mimeType}</span>
                      <span>Size: {(selectedItem.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedItem.aiAnalysisResult && (
                <div className="ai-analysis-details glass-panel">
                  <div className="ai-report-header">
                    <Shield size={20} />
                    <h4>AI Analysis Report</h4>
                    <span className="verdict-tag">{selectedItem.aiAnalysisResult.verdict}</span>
                  </div>
                  
                  <div className="toxicity-meter-large">
                    <div className="meter-label">
                      <span>Toxicity Score</span>
                      <span className="score-value" style={{ color: getToxicityColor(selectedItem.aiAnalysisResult.toxicityScore) }}>
                        {(selectedItem.aiAnalysisResult.toxicityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="meter-bar-bg">
                      <div 
                        className="meter-bar-fill" 
                        style={{ 
                          width: `${selectedItem.aiAnalysisResult.toxicityScore * 100}%`,
                          backgroundColor: getToxicityColor(selectedItem.aiAnalysisResult.toxicityScore)
                        }}
                      ></div>
                    </div>
                  </div>

                  {selectedItem.aiAnalysisResult.detectedCategories?.length > 0 && (
                    <div className="categories-cloud">
                      {selectedItem.aiAnalysisResult.detectedCategories.map(cat => (
                        <span key={cat} className="category-tag">{cat}</span>
                      ))}
                    </div>
                  )}

                  <div className="ai-metadata">
                    <span>Model: {selectedItem.aiAnalysisResult.model}</span>
                    <span>Confidence: {(selectedItem.aiAnalysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {selectedItem.status === 'FLAGGED' && (
              <div className="modal-footer">
                <button 
                  className="modal-action-btn btn-reject-action"
                  onClick={() => handleAction(selectedItem.id, 'REJECT')}
                >
                  <XCircle size={18} />
                  Reject Content
                </button>
                <button 
                  className="modal-action-btn btn-approve-action"
                  onClick={() => handleAction(selectedItem.id, 'APPROVE')}
                >
                  <CheckCircle size={18} />
                  Approve Content
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeratorDashboard;
