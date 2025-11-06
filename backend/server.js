const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { connectDatabase } = require('./config/db');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Group = require('./models/Group');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

connectDatabase(process.env.MONGO_URI);

// Routes
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const groupRoutes = require('./routes/groupRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Socket auth middleware
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.toString().replace('Bearer ', '');
        if (!token) return next(new Error('Unauthorized'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        socket.userId = decoded.id;
        next();
    } catch (e) {
        next(new Error('Unauthorized'));
    }
});

const userIdToSockets = new Map(); // userId -> Set<socketId>
const socketIdToUserId = new Map();

io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userIdToSockets.has(userId)) userIdToSockets.set(userId, new Set());
    userIdToSockets.get(userId).add(socket.id);
    socketIdToUserId.set(socket.id, userId);

    io.emit('presence:update', { userId, status: 'online' });

    socket.on('typing', ({ toUserId, groupId, isTyping }) => {
        if (groupId) {
            io.to(groupId).emit('typing', { userId, groupId, isTyping });
        } else if (toUserId && userIdToSockets.has(toUserId)) {
            for (const sid of userIdToSockets.get(toUserId)) io.to(sid).emit('typing', { userId, isTyping });
        }
    });

    socket.on('private:message', async ({ toUserId, content, clientId }) => {
        if (!toUserId || !content) return;
        const msg = await Message.create({ sender: userId, receiver: toUserId, content, status: 'sent' });
        // echo back to sender as sent
        io.to(socket.id).emit('message:ack', { clientId, message: msg });
        let delivered = false;
        if (userIdToSockets.has(toUserId)) {
            for (const sid of userIdToSockets.get(toUserId)) io.to(sid).emit('private:message', { message: msg });
            delivered = true;
        }
        if (delivered) {
            msg.status = 'delivered';
            await msg.save();
            for (const sid of userIdToSockets.get(userId) || []) io.to(sid).emit('message:update', { id: msg._id, status: 'delivered' });
        }
    });

    socket.on('group:join', async ({ groupId }) => {
        if (groupId) socket.join(groupId);
    });

    socket.on('group:message', async ({ groupId, content, clientId }) => {
        if (!groupId || !content) return;
        const msg = await Message.create({ sender: userId, group: groupId, content, status: 'sent' });
        io.to(groupId).emit('group:message', { message: msg });
        io.to(socket.id).emit('message:ack', { clientId, message: msg });
    });

    socket.on('message:seen', async ({ messageId }) => {
        if (!messageId) return;
        const msg = await Message.findById(messageId);
        if (!msg) return;
        msg.status = 'seen';
        await msg.save();
        const notifyUserId = msg.receiver ? msg.sender.toString() : null; // for private chats notify sender
        if (notifyUserId && userIdToSockets.has(notifyUserId)) {
            for (const sid of userIdToSockets.get(notifyUserId)) io.to(sid).emit('message:update', { id: msg._id, status: 'seen' });
        }
    });

    socket.on('message:delivered', async ({ messageId }) => {
        if (!messageId) return;
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (msg.status === 'sent') {
            msg.status = 'delivered';
            await msg.save();
            const notifyUserId = msg.receiver ? msg.sender.toString() : null;
            if (notifyUserId && userIdToSockets.has(notifyUserId)) {
                for (const sid of userIdToSockets.get(notifyUserId)) io.to(sid).emit('message:update', { id: msg._id, status: 'delivered' });
            }
        }
    });

    socket.on('disconnect', () => {
        socketIdToUserId.delete(socket.id);
        const set = userIdToSockets.get(userId);
        if (set) {
            set.delete(socket.id);
            if (set.size === 0) {
                userIdToSockets.delete(userId);
                io.emit('presence:update', { userId, status: 'offline' });
            }
        }
    });
});

httpServer.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});