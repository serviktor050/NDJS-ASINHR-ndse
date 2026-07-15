const EventEmitter = require('events');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

const chatEmitter = new EventEmitter();

module.exports = {
    async find(users) {
        const chat = await Chat.findOne({
            users: {
                $all: users,
                $size: 2
            },
        });
        return chat;
    },

    async sendMessage({ author, receiver, text }) {
        let chat = await Chat.findOne({
            users: {
                $all: [author, receiver],
                $size: 2
            },
        });

        if (!chat) {
            chat = new Chat({
                users: [author, receiver],
                createdAt: new Date(),
                messages: [],
            });
        }

        const message = {
            _id: new mongoose.Types.ObjectId(),
            author,
            sentAt: new Date(),
            text,
            readAt: null,
        };

        chat.messages.push(message);
        await chat.save();

        chatEmitter.emit('newMessage', {
            chatId: chat._id,
            message,
            users: chat.users.map(String),
        });

        return message;
    },

    subscribe(callback) {
        chatEmitter.on('newMessage', callback);

        return () => {
            chatEmitter.off('newMessage', callback);
        };
    },

    async getHistory(chatId) {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return [];
        }
        return chat.messages;
    },
}