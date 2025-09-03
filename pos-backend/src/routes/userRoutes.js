const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
// login moved to /api/auth/login (use guest middleware there)

module.exports = router;