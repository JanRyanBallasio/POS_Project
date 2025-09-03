const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const guest = require('../middleware/guest');
const auth = require('../middleware/auth');

// Public: register & login should be inaccessible when already authenticated (guest middleware)
router.post('/register', guest, authController.register);
router.post('/login', guest, authController.login);

// Token endpoints
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected check
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;