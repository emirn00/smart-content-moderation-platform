import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import ContentService from '../services/content.service';
import './MySubmissions.css';

const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED': return <span className="status-badge approved"><CheckCircle size={14} /> Approved</span>;
    case 'REJECTED': return <span className="status-badge rejected"><XCircle size={14} /> Rejected</span>;
    case 'FLAGGED': return <span className="status-badge flagged"><AlertTriangle size={14} /> Flagged</span>;
    case 'PENDING': return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
    default: return <span className="status-badge">{status}</span>;
  }
};

const MySubmissions = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const data = await ContentService.getMyContents();
        setContents(data.contents || []);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  if (loading) {
    return (
      <div className="my-submissions-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock className="spinning" size={32} style={{ display: 'inline-block', marginBottom: '1rem', color: '#818cf8' }}/>
          <p style={{ color: '#94a3b8' }}>Loading your history...</p>
        </div>
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="history-empty">
        <FileText size={48} />
        <h3>No Submissions Yet</h3>
        <p>You haven't submitted any content for AI review yet.</p>
      </div>
    );
  }

  return (
    <div className="my-submissions-container">
      {contents.map(item => (
        <div key={item.id} className="submission-card fade-in">
          <div className="submission-content-preview">
            {item.type === 'IMAGE' ? (
              <img src={`/api/uploads/${item.filename}`} alt="Submission" className="submission-thumb" />
            ) : (
              <div className="submission-text-icon">
                <FileText size={24} />
              </div>
            )}
            
            <div className="submission-details">
              <p className="submission-body">
                {item.type === 'IMAGE' ? item.filename : item.body}
              </p>
              <div className="submission-meta">
                <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Clock size={12}/> {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="type-tag" style={{ zoom: 0.85 }}>{item.type}</span>
              </div>
            </div>
          </div>
          
          <div className="submission-status">
            {getStatusBadge(item.status)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySubmissions;
