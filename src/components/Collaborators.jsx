'use client';

export default function Collaborators({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex gap-3 items-center mt-4">
      {users.map((user, index) => (
        <div key={index} className="flex items-center gap-2">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-gray-300"
          />

          <span className="text-sm text-gray-700">{user.name}</span>
        </div>
      ))}
    </div>
  );
}
