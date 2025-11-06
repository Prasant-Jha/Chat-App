const mongoose = require('mongoose');

const connectDatabase = async (mongoUri) => {
    if (!mongoUri) {
        throw new Error('MONGO_URI is not defined');
    }
    try {
        await mongoose.connect(mongoUri, {
            autoIndex: true,
        });
        // Connected
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDatabase };


