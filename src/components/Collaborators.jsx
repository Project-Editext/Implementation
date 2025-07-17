import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

const socket = io('http://localhost:3001'); // adjust URL for your backend

const Collaborators = ({ documentId }) => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user || !documentId) return;

    socket.emit('join-document', {
      documentId,
      name: user.fullName,
      email: user.primaryEmailAddress.emailAddress,
      image: user.imageUrl,
    });

    socket.on('update-user-list', (activeUsers) => {
      setUsers(activeUsers);
    });

    return () => {
      socket.emit('leave-document', {
        documentId,
        email: user.primaryEmailAddress.emailAddress,
      });
    };
  }, [user, documentId]);

  return (
    <div className="flex items-center gap-2">
      {users.map((u) => (
        <div key={u.email} className="flex items-center">
          <img
            src={u.avatar || '/default-avatar.png'}
            alt={u.name}
            title={u.name}
            className="w-8 h-8 rounded-full border"
          />
        </div>
      ))}
    </div>
  );
};

export default Collaborators;
