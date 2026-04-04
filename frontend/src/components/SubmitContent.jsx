import { useState, useRef } from 'react';
import { FileText, Image, Upload, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SubmitContent.css';

const MAX_FILE_SIZE_MB = 5;

function SubmitContent() {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const [contentType, setContentType] = useState('text'); // 'text' | 'image'
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (contentType === 'text' && !text.trim()) {
      setError('Please enter some text content.');
      return;
    }
    if (contentType === 'image' && !imageFile) {
      setError('Please select an image to upload.');
      return;
    }

    setLoading(true);

    // Simulate API call — real endpoint will be wired in next step
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setText('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setContentType('text');
  };

  if (submitted) {
    return (
      <div className="submit-result">
        <CheckCircle size={56} className="result-icon success" />
        <h2>Content Submitted!</h2>
        <p>Your content has been sent to the moderation queue. An AI analysis will run shortly.</p>
        <button className="submit-btn" onClick={handleReset}>Submit Another</button>
      </div>
    );
  }

  return (
    <div className="submit-content-wrapper">
      <div className="submit-header">
        <h2>Submit Content</h2>
        <p>Upload text or an image to be reviewed by our AI moderation system.</p>
      </div>

      {/* Type Selector */}
      <div className="type-selector">
        <button
          type="button"
          className={`type-btn ${contentType === 'text' ? 'active' : ''}`}
          onClick={() => { setContentType('text'); setError(null); }}
        >
          <FileText size={20} />
          <span>Text</span>
        </button>
        <button
          type="button"
          className={`type-btn ${contentType === 'image' ? 'active' : ''}`}
          onClick={() => { setContentType('image'); setError(null); }}
        >
          <Image size={20} />
          <span>Image</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="submit-form">
        {/* Text Input */}
        {contentType === 'text' && (
          <div className="content-input-area">
            <textarea
              id="content-text"
              className="text-input"
              placeholder="Enter your text content here. Our AI will analyze it for toxicity..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              maxLength={5000}
              disabled={!isAuthenticated}
            />
            <div className="char-count">{text.length} / 5000</div>
          </div>
        )}

        {/* Image Input */}
        {contentType === 'image' && (
          <div
            className={`image-drop-zone ${dragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''} ${!isAuthenticated ? 'disabled' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (isAuthenticated) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={isAuthenticated ? handleDrop : undefined}
            onClick={() => isAuthenticated && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleImageChange(e.target.files[0])}
              disabled={!isAuthenticated}
            />
            {imagePreview ? (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <div className="image-overlay">
                  <span>Click or drop to change</span>
                </div>
              </div>
            ) : (
              <div className="drop-zone-placeholder">
                <Upload size={40} className="upload-icon" />
                <p>Drag & drop an image here</p>
                <span>or click to browse</span>
                <small>PNG, JPG, WEBP — max {MAX_FILE_SIZE_MB}MB</small>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="submit-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Gate */}
        {!isAuthenticated && (
          <div className="auth-gate">
            <Lock size={18} />
            <span>You must be <Link to="/login" className="auth-gate-link">logged in</Link> to submit content.</span>
          </div>
        )}

        <button
          type="submit"
          id="submit-content-btn"
          className="submit-btn"
          disabled={!isAuthenticated || loading}
        >
          {loading ? (
            <><span className="btn-spinner" /> Submitting...</>
          ) : (
            <><Upload size={18} /> Submit for Review</>
          )}
        </button>
      </form>
    </div>
  );
}

export default SubmitContent;
