const cors = require('cors');

const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://3.25.180.232:3000",
    "http://13.211.162.106:5000"
];

const options = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
};

module.exports = cors();