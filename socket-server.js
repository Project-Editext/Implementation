const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  socket.on('join-document', ({ docId, user }) => {
    socket.join(docId);
    socket.data.user = user;
    socket.data.docId = docId;

    io.to(docId).emit('users-updated', getUsers(docId));
  });

  socket.on('disconnect', () => {
    const docId = socket.data?.docId;
    if (docId) {
      io.to(docId).emit('users-updated', getUsers(docId));
    }
  });
});

function getUsers(docId) {
  const room = io.sockets.adapter.rooms.get(docId);
  if (!room) return [];
  return [...room]
    .map((id) => io.sockets.sockets.get(id)?.data?.user)
    .filter(Boolean);
}

server.listen(4000, () => {
  console.log('✅ Socket.IO server running at http://localhost:4000');
});
