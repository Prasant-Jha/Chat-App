const express = require('express');
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const router = express.Router();

router.use(authenticate);

// Private chat history
router.get('/private/:userId', async (req, res) => {
    const otherId = req.params.userId;
    const me = req.user.id;
    const messages = await Message.find({
        $or: [
            { sender: me, receiver: otherId },
            { sender: otherId, receiver: me }
        ]
    }).sort({ createdAt: 1 });
    res.json({ messages });
});

// Group chat history
router.get('/group/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const messages = await Message.find({ group: groupId }).sort({ createdAt: 1 });
    res.json({ messages });
});

module.exports = router;


