"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useUser } from "@clerk/nextjs";
import "../../../../public/css/globals.css";

export default function EditorPage() {
  const { id: documentId } = useParams();
  const { user } = useUser();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSharedUser, setIsSharedUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle', 'saving', 'saved', 'error'
  const saveTimeoutRef = useRef(null);

  // states for share modal and email input
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Start typing here...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!documentId) return;
      
      // Update save status
      setSaveStatus("saving");
      
      // Clear any previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set a new timeout to actually save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedContent = editor.getHTML();
          const res = await fetch(`/api/documents/${documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedContent }),
          });
          
          if (res.ok) {
            setSaveStatus("saved");
            // Clear saved status after 2 seconds
            setTimeout(() => setSaveStatus("idle"), 2000);
          } else {
            setSaveStatus("error");
          }
        } catch (err) {
          console.error("Error saving document:", err);
          setSaveStatus("error");
        }
      }, 500); // 500ms debounce
    },
    immediatelyRender: false,
  });

  const handleSaveTitle = async () => {
    setSaveStatus("saving");
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setIsEditingTitle(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving title:", err);
      setSaveStatus("error");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmDelete) return;

    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to delete document.");
        setSaveStatus("idle");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setSaveStatus("error");
    }
  };

  useEffect(() => {
    async function loadContent() {
      if (!documentId) return;
      setSaveStatus("loading");
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          const initialContent = data.content || "";
          setContent(initialContent);
          setTitle(data.title || "Untitled");
          setIsOwner(data.userId === user?.id);
          const email = user?.primaryEmailAddress?.emailAddress;
          if (email && data.sharedWith?.includes(email)) {
            setIsSharedUser(true);
          }

          editor?.commands.setContent(initialContent);
          setSaveStatus("idle");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setSaveStatus("error");
      }
    }
    loadContent();
    
    // Clean up timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [documentId, editor, user]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Status indicator text
  const getStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "All changes saved";
      case "error":
        return "Error saving";
      case "loading":
        return "Loading...";
      default:
        return "";
    }
  };

  // Status indicator color
  const getStatusColor = () => {
    switch (saveStatus) {
      case "saving":
        return "text-yellow-500";
      case "saved":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "loading":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  if (!user) return <p className="text-center mt-10">You must be signed in.</p>;
  if (!editor) return null;

  return (
    <div className="editor-container">
      <div className="mb-4">
        {/* Status indicator above title */}
        <div className="flex justify-end mb-1">
          <div className={`text-sm ${getStatusColor()} transition-opacity duration-300`}>
            {getStatusText()}
          </div>
        </div>
        
        {/* Title with underline */}
        <div className="border-b border-gray-300 pb-2 mb-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="editor-title flex-grow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={handleSaveTitle} className="btn-primary">
                Save
              </button>
              <button 
                onClick={() => setIsEditingTitle(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h2 
              className="editor-title cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              {title || "Untitled"}
            </h2>
          )}
        </div>
        
        {/* Action buttons */}
        {(isOwner || isSharedUser) && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsEditingTitle(true)}
              className="btn-secondary"
            >
              Rename
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-secondary"
            >
              Share
            </button>
            <button 
              onClick={handleDelete}
              className={`btn-danger ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`} 
              disabled={!isOwner}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="editor-toolbar">
        {[
          { cmd: "toggleBold", label: "B" },
          { cmd: "toggleItalic", label: "I" },
          { cmd: "toggleUnderline", label: "U" },
          { cmd: "toggleBulletList", label: "• List" },
          { cmd: "toggleOrderedList", label: "1. List" },
          { cmd: "setParagraph", label: "P" },
          { cmd: "toggleHeading", args: { level: 1 }, label: "H1" },
          { cmd: "toggleHeading", args: { level: 2 }, label: "H2" },
          { cmd: "setTextAlign", args: "left", label: "Left" },
          { cmd: "setTextAlign", args: "center", label: "Center" },
          { cmd: "setTextAlign", args: "right", label: "Right" },
          { cmd: "undo", label: "Undo" },
          { cmd: "redo", label: "Redo" },
        ].map(({ cmd, label, args }, idx) => (
          <button
            key={idx}
            onClick={() =>
              args
                ? editor.chain().focus()[cmd](args).run()
                : editor.chain().focus()[cmd]().run()
            }
            className="toolbar-btn"
          >
            {label}
          </button>
        ))}
      </div>

      <EditorContent editor={editor} className="ProseMirror" />
  
      {showShareModal && (
        <div className="modal-backdrop">
          <div className="custom-modal">
            <h3 className="modal-title">Share Document</h3>
            <p className="modal-text">Enter an email address to share this document:</p>

            <input
              type="email"
              id="share-email"
              name="shareEmail"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="user@example.com"
              className="modal-input"
            />

            {shareMessage && <p className="modal-message">{shareMessage}</p>}

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={async () => {
                  const res = await fetch(`/api/documents/${documentId}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: shareEmail }),
                  });

                  const data = await res.json();
                  if (res.ok) {
                    setShareMessage("Shared successfully!");
                    setShareEmail("");
                  } else {
                    setShareMessage("Error: " + data.message);
                  }
                }}
              >
                Share
              </button>
              <button onClick={() => setShowShareModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}