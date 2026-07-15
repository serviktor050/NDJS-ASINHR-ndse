const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true,
        required: true,
        unique: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: false
    },
    sentAt: {
        type: Date,
        default: Date.now,
        required: true,
        unique: false
    },
    text: {
        type: String,
        required: true,
        unique: false
    },
    readAt: {
        type: Date,
        default: null,
        required: false,
        unique: false
    },
});

const chatSchema = new Schema({
    users: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        validate: {
            validator: (v) => v.length === 2,
            message: 'Chat must have exactly 2 users',
        },
        required: true,
        unique: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
        unique: false
    },
    messages: {
        type: [messageSchema],
        default: [],
        required: false,
        unique: false
    },
});

module.exports = model('Chat', chatSchema);