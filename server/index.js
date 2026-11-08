require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const adminRoutes = require('./routes/admin');
const timetableRoutes = require('./routes/timetable');
const chatRoutes = require('./routes/chat');
const notificationsRoutes = require('./routes/notifications');
const sendiyouRoutes = require('./routes/sendiyou');
const campusRoutes = require('./routes/campuses');
const { router: attendanceRoutes } = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/admin', adminRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sendiyou', sendiyouRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the React app if available in production
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Timbel API', version: '2.5' });
  });
}

// ---------------------------------------------------------------------------
// Error handling middleware
// ---------------------------------------------------------------------------

// Handle multer-specific errors
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err.message && err.message.includes('Only Excel files')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Timetable Detector server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
