// src\components\MoveToFolderModal.jsx
import { useState, useEffect } from 'react';

export default function MoveToFolderModal({ isOpen, onClose, onMove, folders, doc }) {
  const [selectedFolderId, setSelectedFolderId] = useState('');

  // Reset selection whenever modal opens or doc changes
  useEffect(() => {
    if (isOpen) setSelectedFolderId('');
  }, [isOpen, doc]);

  if (!isOpen) return null;

  const handleMove = () => {
    // Prevent moving if already in the selected folder
    if ((doc.folderId || '') === selectedFolderId) {
      onClose();
      return;
    }
    onMove(doc, selectedFolderId || null); // Pass null if "Root" is chosen
    onClose(); // Close modal after moving
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Move "{doc?.title || 'Untitled'}"
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select a destination folder.</p>
        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">-- Move to Root --</option>
          {folders.map(folder => (
            <option key={folder._id} value={folder._id}>
              {folder.name}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
