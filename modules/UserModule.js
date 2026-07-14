const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SALT_ROUNDS = 10;

module.exports = {
    async create(data) {
        const { email, password, name, contactPhone } = data;

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = new User({
            email,
            passwordHash,
            name,
            contactPhone: contactPhone || null,
        });
        await user.save();

        return user;
    },

    async findByEmail(email) {
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });
        return user;
    },
};