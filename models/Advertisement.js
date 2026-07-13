const { Schema, model } = require('mongoose');

const advertisementSchema = new Schema({
    shortText: {
        type: String,
        required: true,
        unique: false
    },
    description: {
        type: String,
        default: '',
        required: false,
        unique: false
    },
    images: {
        type: [String],
        default: [],
        required: false,
        unique: false
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
        unique: false
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: true,
        unique: false
    },
    tags: {
        type: [String],
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false,
        required: true,
        unique: false
    },
});

advertisementSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = model('Advertisement', advertisementSchema);