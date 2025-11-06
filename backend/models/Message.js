const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    content: { type: String, required: true },
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ receiver: 1, group: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);


