const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const sendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
        if (recipientId === req.user.id) return res.status(400).json({ message: 'Cannot add yourself' });
        await FriendRequest.create({ requester: req.user.id, recipient: recipientId });
        return res.status(201).json({ message: 'Request sent' });
    } catch (err) {
        return res.status(400).json({ message: 'Could not send request' });
    }
};

const respondRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body; // 'accept' | 'reject'
        const fr = await FriendRequest.findById(requestId);
        if (!fr || fr.recipient.toString() !== req.user.id) return res.status(404).json({ message: 'Not found' });
        if (action === 'accept') {
            fr.status = 'accepted';
        } else if (action === 'reject') {
            fr.status = 'rejected';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }
        await fr.save();
        return res.json({ message: 'Updated', status: fr.status });
    } catch (err) {
        return res.status(400).json({ message: 'Could not update request' });
    }
};

const listFriends = async (req, res) => {
    // Basic: list accepted connections involving the user
    const accepted = await FriendRequest.find({
        $or: [{ requester: req.user.id }, { recipient: req.user.id }],
        status: 'accepted'
    }).populate('requester recipient', 'name email status profile_pic');
    const friends = accepted.map(fr => {
        const a = fr.requester._id.toString() === req.user.id ? fr.recipient : fr.requester;
        return a;
    });
    return res.json({ friends });
};

const listIncoming = async (req, res) => {
    const incoming = await FriendRequest.find({ recipient: req.user.id, status: 'pending' })
        .populate('requester', 'name email profile_pic status');
    return res.json({ requests: incoming });
};

const listStatus = async (req, res) => {
    const myId = req.user.id;
    const pendingOutgoing = await FriendRequest.find({ requester: myId, status: 'pending' }).select('recipient');
    const accepted = await FriendRequest.find({
        status: 'accepted',
        $or: [{ requester: myId }, { recipient: myId }]
    }).select('requester recipient');

    const pendingOutgoingIds = pendingOutgoing.map(fr => fr.recipient.toString());
    const friendIds = accepted.map(fr => (fr.requester.toString() === myId ? fr.recipient.toString() : fr.requester.toString()));

    return res.json({ pendingOutgoing: pendingOutgoingIds, friends: friendIds });
};

module.exports = { sendRequest, respondRequest, listFriends, listIncoming, listStatus };


