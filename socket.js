const socketIO = require('socket.io');
const cookie = require('cookie');
const ChatModule = require('./modules/Chat');

/* Хранилище: ключ — ID пользователя, значение — массив сокетов */
const userSockets = new Map();

function setupSocket(server, sessionMiddleware, passport) {
    const io = socketIO(server);

    io.use(async (socket, next) => {
        try {
            const cookies = socket.handshake.headers.cookie;
            if (!cookies) return next(new Error('No cookies'));

            const parsedCookies = cookie.parse(cookies);
            const sid = parsedCookies['connect.sid'];
            if (!sid) return next(new Error('No session cookie'));

            const sidUnsigned = decodeURIComponent(sid).split(':')[1].split('.')[0];

            const sessionStore = sessionMiddleware.store;
            const sessionData = await sessionStore.get(sidUnsigned);

            if (!sessionData || !sessionData.passport || !sessionData.passport.user) {
                return next(new Error('Not authenticated'));
            }

            const user = await new Promise((resolve, reject) => {
                passport.deserializeUser(sessionData.passport.user, (err, u) => {
                    if (err) return reject(err);
                    resolve(u);
                });
            });

            if (!user) return next(new Error('User not found'));

            socket.request.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.request.user._id.toString();

        if (!userSockets.has(userId)) {
            userSockets.set(userId, []);
        }
        userSockets.get(userId).push(socket);

        const unsubscribe = ChatModule.subscribe(({ chatId, message, users }) => {
            for (const uid of users) {
                const sockets = userSockets.get(uid);
                if (sockets) {
                    sockets.forEach(s => s.emit('newMessage', message));
                }
            }
        });

        socket.on('getHistory', async (receiverId) => {
            try {
                const chat = await ChatModule.find([userId, receiverId]);
                if (!chat) {
                    socket.emit('chatHistory', []);
                    return;
                }
                const messages = await ChatModule.getHistory(chat._id);
                socket.emit('chatHistory', messages);
            } catch (err) {
                socket.emit('chatHistory', []);
            }
        });

        socket.on('sendMessage', async (data) => {
            try {
                const { receiver, text } = data;
                const message = await ChatModule.sendMessage({
                    author: userId,
                    receiver,
                    text,
                });
            } catch (err) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            const userSockArr = userSockets.get(userId);
            if (userSockArr) {
                const idx = userSockArr.indexOf(socket);
                if (idx !== -1) userSockArr.splice(idx, 1);
                if (userSockArr.length === 0) userSockets.delete(userId);
            }
            unsubscribe();
        });
    });

    return io;
}

module.exports = setupSocket;