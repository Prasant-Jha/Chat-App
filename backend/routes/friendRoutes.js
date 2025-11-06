const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendRequest, respondRequest, listFriends, listIncoming, listStatus } = require('../controllers/friendController');
const router = express.Router();

router.use(authenticate);
router.post('/request', sendRequest);
router.post('/respond', respondRequest);
router.get('/list', listFriends);
router.get('/incoming', listIncoming);
router.get('/status', listStatus);

module.exports = router;


