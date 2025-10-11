require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const projectRoutes = require('./routes/projects');  // ← ADD THIS LINE
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'claude-max-api' });
});

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/projects', projectRoutes);  // ← ADD THIS LINE

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('✅ Database connected');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend API running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
