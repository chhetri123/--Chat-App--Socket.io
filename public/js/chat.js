const socket = io();
// const btn = document.getElementById("increment");
const form = document.getElementById('message-form');
const messages = document.querySelector('#messages');
const btn = document.getElementById('send_message');
const sendLocation = document.getElementById('send-location');
// const input = document.querySelector("#message");

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

const autoScroll = () => {
    const newMessage = messages.lastElementChild;
    const newMessageStyle = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;
    const visibleHeight = messages.offsetHeight;
    const containerHeight = messages.scrollHeight;
    const scrollOffset = messages.scrollTop + visibleHeight;
    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        name: message.name,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationSend', (link) => {
    const html = Mustache.render(locationTemplate, {
        name: link.name,
        link: link.text,
        createdAt: moment(link.createdAt).format('hh:mm a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener('submit', function (e) {
    e.preventDefault();
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        if (error) {
            return alert(error);
        }
        e.target.elements.message.style.border = '1px solid green';
        e.target.elements.message.value = '';
        e.target.elements.message.focus();
    });
});
sendLocation.addEventListener('click', function (e) {
    if (!navigator.geolocation) return socket.emit('sendMessage', 'Geolocation is not supported');
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('sendLocation', { latitude, longitude }, (msg) => {
            return console.log(msg);
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
