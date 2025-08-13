"use client";

import { useState, useEffect } from "react"; // MODIFIED: Imported useEffect
import { useRouter } from "next/navigation";

// MODIFIED: The component now accepts 'folders' and 'currentFolderId' as props
export default function CreateDocModal({ isOpen, onClose, folders, currentFolderId }) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("");
  // ADDED: State to hold the selected folder ID
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const router = useRouter();

  // ADDED: A side effect to set the default folder to the current view
  useEffect(() => {
    // When the modal is opened, pre-select the folder the user is currently in
    if (isOpen) {
      setSelectedFolderId(currentFolderId || '');
    }
  }, [isOpen, currentFolderId]);


  const handleCreate = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // MODIFIED: The request body now includes the selected folderId
        body: JSON.stringify({
          title: title || "Untitled",
          template,
          folderId: selectedFolderId || null, // Send null if no folder is selected
        }),
      });

      const data = await res.json();

      if (res.ok && data._id) {
        onClose();
        setTitle(''); // Reset title on close
        setTemplate(''); // Reset template on close
        router.push(`/editor/${data._id}`); // go to edit page
      } else {
        alert("Failed to create document");
      }
    } catch (err) {
      console.error("Error creating document:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-[500px]">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Creating Document</h2>

        <label className="block text-lg mb-2 text-gray-800 dark:text-gray-200">Title:</label>
        <input
          type="text"
          placeholder="Give this file a name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />

        {/* ADDED: Folder selection dropdown */}
        <label className="block text-lg mb-2 text-gray-800 dark:text-gray-200">Location:</label>
        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">-- Save to Root --</option>
          {folders.map(folder => (
            <option key={folder._id} value={folder._id}>
              {folder.name}
            </option>
          ))}
        </select>

        <label className="block text-md mb-2 text-gray-800 dark:text-gray-200">
          You can search for a template here:{" "}
          <span className="text-gray-500">*</span> Optional
        </label>
        <input
          type="text"
          placeholder="resume"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 px-4 py-1 mt-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-1 mt-4 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}