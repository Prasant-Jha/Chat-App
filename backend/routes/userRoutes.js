const express = require('express');
const { authenticate } = require('../middleware/auth');
const { listUsers } = require('../controllers/userController');
const router = express.Router();

router.use(authenticate);
router.get('/list', listUsers);

module.exports = router;


