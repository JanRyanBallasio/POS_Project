const cors = require('cors');

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost',
  'app://localhost'
];

const allowedOrigins =
  (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',')) ||
  defaultOrigins;

const options = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalized = origin.toLowerCase().replace(/\/$/, '');

    const isAllowed =
      allowedOrigins.some(o => normalized === o.toLowerCase().replace(/\/$/, '')) ||
      normalized.includes('tauri.localhost');

    if (isAllowed) {
      console.log('✅ CORS allowed origin:', origin);
      return callback(null, true);
    }

    console.log('🚫 CORS rejected origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  preflightContinue: false
};

module.exports = cors(options);
