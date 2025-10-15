const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = '/app/uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter - accept images, PDFs, text files, code files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'text/javascript',
    'text/html',
    'text/css',
    'application/javascript',
    'application/x-python',
    'text/x-python'
  ];

  const allowedExtensions = ['.js', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php', '.ts', '.jsx', '.tsx', '.md', '.txt', '.csv', '.json', '.html', '.css', '.xml', '.yaml', '.yml'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// Upload endpoint - accepts multiple files
router.post('/', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const result = await pool.query(
        `INSERT INTO message_files 
         (filename, original_filename, mime_type, file_size, file_path, message_id)
         VALUES ($1, $2, $3, $4, $5, NULL)
         RETURNING *`,
        [
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          file.path
        ]
      );

      uploadedFiles.push(result.rows[0]);
    }

    res.json({
      success: true,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Get file by ID
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await pool.query(
      'SELECT * FROM message_files WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.rows[0];
    res.sendFile(file.file_path);

  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await pool.query(
      'SELECT * FROM message_files WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = result.rows[0];

    await fs.unlink(file.file_path);

    await pool.query('DELETE FROM message_files WHERE id = $1', [fileId]);

    res.json({ success: true, message: 'File deleted' });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
