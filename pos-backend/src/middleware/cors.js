const cors = require('cors');

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  "tauri://localhost",   // important for packaged app
  "https://tauri.localhost",
  "http://tauri.localhost"
];

// you can set ALLOWED_ORIGINS as a comma-separated env var
const allowedOrigins = (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',')) || defaultOrigins;

const options = {
  origin: (origin, callback) => {
    // allow requests with no origin (curl, mobile, same-origin server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // IMPORTANT: allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
};

module.exports = cors(options);