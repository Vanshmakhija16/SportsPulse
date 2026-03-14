const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ─────────────────────────────────────────
//  CORS — Allow multiple origins
// ─────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',        // Local dev
  'http://localhost:3000',        // Local dev alternate port
  'http://localhost:4173',        // Vite preview
  process.env.FRONTEND_URL,      // Netlify production URL
].filter(Boolean);               // Remove undefined/null entries

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests for ALL routes
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/teams',         require('./routes/teams'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/results',       require('./routes/results'));
app.use('/api/admin',         require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:   'OK',
    message:  'SportsPulse API is running',
    origins:  allowedOrigins,
    time:     new Date().toISOString()
  });
});

// ─────────────────────────────────────────
//  Connect to MongoDB
// ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('🌐 Allowed CORS origins:', allowedOrigins);
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
