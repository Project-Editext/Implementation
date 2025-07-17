import { NextResponse } from 'next/server';
import { Server } from 'socket.io';

export const runtime = 'nodejs'; // ensure Node.js runtime for WebSocket support

let io;

export async function GET(request) {
  const { socket } = request;

  if (!socket.server.io) {
    console.log('Setting up Socket.IO server...');

    io = new Server(socket.server);

    io.on('connection', (socket) => {
      console.log('New socket connected:', socket.id);

      socket.on('join-document', ({ docId, user }) => {
        socket.join(docId);
        console.log(`${user.name} joined document ${docId}`);

        // Store user info on socket instance
        socket.user = user;

        // Emit updated user list to the room
        const clients = io.sockets.adapter.rooms.get(docId) || new Set();
        const users = Array.from(clients).map(id => io.sockets.sockets.get(id)?.user).filter(Boolean);
        io.to(docId).emit('users-updated', users);

        socket.on('disconnect', () => {
          console.log(`${user.name} disconnected from ${docId}`);
          // Update user list after disconnect
          const clientsAfter = io.sockets.adapter.rooms.get(docId) || new Set();
          const usersAfter = Array.from(clientsAfter).map(id => io.sockets.sockets.get(id)?.user).filter(Boolean);
          io.to(docId).emit('users-updated', usersAfter);
        });
      });

      // Add other event handlers as needed here
    });

    socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }

  return NextResponse.json({ message: 'Socket.io initialized' });
}
