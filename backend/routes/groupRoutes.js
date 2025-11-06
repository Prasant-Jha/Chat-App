const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createGroup, addMember, removeMember, myGroups } = require('../controllers/groupController');
const router = express.Router();

router.use(authenticate);
router.post('/', createGroup);
router.post('/add', addMember);
router.post('/remove', removeMember);
router.get('/mine', myGroups);

module.exports = router;


