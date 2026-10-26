require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const codeExecutionRoutes = require('./routes/codeExecutionRoutes');

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const isDevLocalhostOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return isHttp && isLocalhost;
  } catch {
    return false;
  }
};

const isPrivateLanIp = (hostname) => {
  // IPv4 private ranges:
  // - 10.0.0.0/8
  // - 172.16.0.0/12
  // - 192.168.0.0/16
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const parts = hostname.split('.').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
};

const isDevLanOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    return isHttp && isPrivateLanIp(url.hostname);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);

      // Explicit allow list always wins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Dev-friendly: allow localhost/127.0.0.1 on any port
      if (!isProduction && isDevLocalhostOrigin(origin)) return callback(null, true);

      // Dev-friendly: allow common private LAN IPs on any port
      // (useful when accessing the frontend via http://<your-ip>:3000/3001)
      if (!isProduction && isDevLanOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/code-execution', codeExecutionRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
