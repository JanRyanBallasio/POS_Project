const cors = require('cors');

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost',
  'app://localhost',
  'http://3.107.238.186:3000',
  'http://3.107.238.186' // ✅ add this too
];

const envOrigins =
  (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(',')) || [];

const normalize = (s) => String(s).toLowerCase().replace(/\/$/, '');

const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...envOrigins].map(normalize))
);

const options = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalized = normalize(origin);

    const isAllowed =
      allowedOrigins.includes(normalized) ||
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
