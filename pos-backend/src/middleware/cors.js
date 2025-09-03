// ...existing code...
const cors = require('cors');

const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:3000",
  "http://3.25.180.232:3000",
  "http://13.211.162.106:5000"
];

const options = {
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile clients, curl) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // IMPORTANT: allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
};

module.exports = cors(options);
// ...existing code...