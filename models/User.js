const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    passwordHash: {
        type: String,
        required: true,
        unique: false
    },
    name: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        lowercase: true,
    },
    contactPhone: {
        type: String,
        required: false,
        unique: false,
        default: null
    },
})

module.exports = model('User', userSchema);