const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'change_this_in_production';

module.exports = {
  generateToken(payload, expiresIn = '8h') {
    return jwt.sign(payload, SECRET, { expiresIn });
  },

  verifyToken(token) {
    return jwt.verify(token, SECRET);
  },

  // lower-level exports if needed
  sign: (payload, opts) => jwt.sign(payload, SECRET, opts),
  verify: (token) => jwt.verify(token, SECRET),
};