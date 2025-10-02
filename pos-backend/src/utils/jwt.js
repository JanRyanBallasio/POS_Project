// Simple stub to prevent import errors
// No actual JWT functionality since auth is disabled

module.exports = {
  generateToken: (payload, expiresIn) => {
    // Return a simple token for compatibility
    return 'no-auth-token';
  },
  
  verifyToken: (token) => {
    // Return a simple payload for compatibility
    return { id: 1, username: 'no-auth' };
  }
};
