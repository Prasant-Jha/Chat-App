const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const signToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already in use' });
        const user = await User.create({ name, email, password });
        const token = signToken(user._id.toString());
        return res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email, profile_pic: user.profile_pic },
            token
        });
    } catch (err) {
        return res.status(500).json({ message: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await user.comparePassword(password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const token = signToken(user._id.toString());
        return res.json({
            user: { id: user._id, name: user.name, email: user.email, profile_pic: user.profile_pic },
            token
        });
    } catch (err) {
        return res.status(500).json({ message: 'Login failed' });
    }
};

module.exports = { register, login };


