//src/components/CreateDocModal.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateDocModal({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "Untitled",
          template,
        }),
      });

      const data = await res.json();

      if (res.ok && data.documentId) {
        onClose();
        router.push(`/editor/${data.documentId}`); // go to edit page
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
      <div className="bg-white p-8 rounded-xl shadow-lg w-[500px]">
        <h2 className="text-2xl font-bold mb-6">Creating Document</h2>

        <label className="block text-lg mb-2">Title:</label>
        <input
          type="text"
          placeholder="Give this file a name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-md"
        />

        <label className="block text-md mb-2">
          You can search for a template here:{" "}
          <span className="text-gray-500">*</span> Optional
        </label>
        <input
          type="text"
          placeholder="resume"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded-md"
        />

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-1 mt-4 rounded hover:bg-gray-400 "
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
