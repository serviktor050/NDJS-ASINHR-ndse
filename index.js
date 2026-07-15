require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
const path = require('path');
const http = require('http');
const setupSocket = require('./socket');

const app = express();

require('./models/User');
require('./models/Advertisement');
require('./models/Chat');

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api', require('./routes'));

const server = http.createServer(app);

setupSocket(server, sessionMiddleware, passport);

const PORT = process.env.PORT || 3000

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start();