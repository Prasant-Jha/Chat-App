const User = require('../models/User');

const listUsers = async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('_id name email status profile_pic');
    res.json({ users });
};

module.exports = { listUsers };


