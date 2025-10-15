import React, { useState } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFilesSelected, selectedFiles, onRemoveFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    if (mimeType === 'application/json') return '{ }';
    return '📎';
  };

  return (
    <div className="file-upload-container">
      {/* Selected Files Display */}
      {selectedFiles && selectedFiles.length > 0 && (
        <div className="selected-files">
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-chip">
              <span className="file-icon">{getFileIcon(file.type)}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
              <button
                className="remove-file-btn"
                onClick={() => onRemoveFile(index)}
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.txt,.md,.json,.js,.py,.java,.cpp,.c,.go,.rs,.rb,.php,.ts,.jsx,.tsx,.html,.css,.xml,.yaml,.yml,.csv"
        />
        <label htmlFor="file-input" className="file-input-label">
          <div className="dropzone-content">
            <span className="dropzone-icon">📎</span>
            <span className="dropzone-text">
              {isDragging ? 'Drop files here' : 'Click or drag files to attach'}
            </span>
            <span className="dropzone-hint">
              Images, PDFs, text files, code files (max 50MB each)
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default FileUpload;
