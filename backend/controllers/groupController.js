const Group = require('../models/Group');

const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        if (!name) return res.status(400).json({ message: 'name required' });
        const members = Array.isArray(memberIds) ? memberIds : [];
        const group = await Group.create({ name, creator: req.user.id, members: [req.user.id, ...members] });
        return res.status(201).json({ group });
    } catch (err) {
        return res.status(400).json({ message: 'Could not create group' });
    }
};

const addMember = async (req, res) => {
    const { groupId, userId } = req.body;
    const group = await Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } }, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    return res.json({ group });
};
const removeMember = async (req, res) => {
    const { groupId, userId } = req.body;
    const group = await Group.findByIdAndUpdate(groupId, { $pull: { members: userId } }, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    return res.json({ group });
};

const myGroups = async (req, res) => {
    const groups = await Group.find({ members: req.user.id });
    return res.json({ groups });
};

module.exports = { createGroup, addMember, removeMember, myGroups };


