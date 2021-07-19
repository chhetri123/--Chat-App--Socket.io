const express = require('express');
const http = require('http');
const app = express();
const socketio = require('socket.io');
const Filter = require('bad-words');

const server = http.createServer(app);
const io = socketio(server);
const generateMessage = require('./utils/messages');
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users');

const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.render('index');
});

let msg = 'Welcome to the chat box ';
io.on('connection', (socket) => {
    socket.on('join', (option, callback) => {
        const { error, user } = addUser({
            id: socket.id,
            ...option,
        });
        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        //
        socket.emit('message', generateMessage(user.username, msg));
        socket.broadcast
            .to(user.room)
            .emit('message', generateMessage('Admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room),
        });
        callback('');
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });
    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id);

        const link = `https://www.google.com/maps/@${latitude},${longitude},15z`;
        io.to(user.room).emit('locationSend', generateMessage(user.username, link));
        callback('location shared');
    });

    //

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room),
            });
        }
    });
});
server.listen(port, () => {});
