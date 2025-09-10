const express = require('express');
const router = express.Router();
// switched to use the central userController instead of duplicate auth.controller
const userController = require('../controllers/userController');
const guest = require('../middleware/guest');
const auth = require('../middleware/auth');

// Public: register & login should be inaccessible when already authenticated (guest middleware)
router.post('/register', guest, userController.createUser);
router.post('/login', guest, userController.loginUser);

// Token endpoints
router.post('/refresh', (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Protected check
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;