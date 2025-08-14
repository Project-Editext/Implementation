// src/app/editor/[id]/page.js
"use client";
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useUser } from "@clerk/nextjs";
import "../../../../public/css/globals.css";
import Comment from "@/components/Comment";
import Collaborators from "@/components/Collaborators";
import AIChatPopup from "@/components/AIChatPopup";
import Link from "@tiptap/extension-link";
import { formatDistanceToNow } from "date-fns";
import SmartSearch from "@/components/SmartSearch";

export default function EditorPage() {
  const { id: documentId } = useParams();
  const { user } = useUser();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSharedUser, setIsSharedUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const saveTimeoutRef = useRef(null);
  const [accessLevel, setAccessLevel] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [shareAccess, setShareAccess] = useState("view");
  const [collaborators, setCollaborators] = useState([]);
  const socketRef = useRef(null);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [wordCount, setWordCount] = useState(null);

  // Socket.io for real-time collaboration
  useEffect(() => {
    if (!user || !documentId) return;

    const socket = io("https://socket-server-eo5i.onrender.com");
    socketRef.current = socket;

    socket.emit("join-document", {
      docId: documentId,
      user: {
        name: user.fullName,
        avatar: user.imageUrl,
      },
    });

    socket.on("users-updated", (users) => {
      setCollaborators(users);
    });

    return () => socket.disconnect();
  }, [user, documentId]);

  // Word count handler
  const handleWordCount = () => {
    if (!editor) return;
    const plainText = editor.getText();
    const count = plainText.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(count);
  };

  // Document duplication
  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/duplicate`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to duplicate document");
      
      const data = await res.json();
      router.push(`/editor/${data.newDocumentId}`);
    } catch (error) {
      console.error("Duplicate error:", error);
      alert("Error duplicating document");
    }
  };

  // Tiptap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        history: true,
        table: false // Disable default table extension
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Start typing here...",
        emptyEditorClass: "is-editor-empty",
      }),
      Comment,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-blue-600 underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      // Table extensions
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "tiptap-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable: accessLevel !== "view",
    onUpdate: ({ editor }) => {
      if (!documentId || accessLevel === "view") return;

      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedContent = editor.getHTML();
          const updatedComments = extractCommentsFromDoc(editor.state.doc);
          const res = await fetch(`/api/documents/${documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: updatedContent,
              comments: updatedComments,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setSaveStatus("saved");
            setLastUpdated(data.updatedAt);
            setTimeout(() => setSaveStatus("idle"), 2000);
          } else {
            setSaveStatus("error");
          }
        } catch (err) {
          console.error("Error saving document:", err);
          setSaveStatus("error");
        }
      }, 500);
    },
  });

  // Document operations
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
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      res.ok ? router.push("/dashboard") : alert("Failed to delete document.");
    } catch (err) {
      console.error("Error deleting document:", err);
      setSaveStatus("error");
    }
  };

  const handleExport = async (type) => {
    const fileName = title || documentId || "document";
    const element = document.querySelector(".ProseMirror");
    if (!element) return alert("No content found to export.");

    if (type === "pdf") {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: 10,
          filename: `${fileName}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } else if (type === "txt") {
      const text = element.innerText;
      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Comment management
  function extractCommentsFromDoc(doc) {
    const commentMap = new Map();
    doc.descendants((node) => {
      node.marks?.forEach((mark) => {
        if (mark.type.name === "comment" && mark.attrs?.id && mark.attrs?.content) {
          commentMap.set(mark.attrs.id, mark.attrs.content);
        }
      });
    });
    return Array.from(commentMap.entries()).map(([id, text]) => ({ id, text }));
  }

  // Initial document load
  useEffect(() => {
    if (!documentId) return;
    
    setSaveStatus("loading");
    const loadContent = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) return setSaveStatus("error");
        
        const data = await res.json();
        const initialContent = data.content || "";
        setContent(initialContent);
        setTitle(data.title || "Untitled");
        setLastUpdated(data.updatedAt);
        setIsOwner(data.userId === user?.id);
        
        const email = user?.primaryEmailAddress?.emailAddress;
        if (email && data.sharedWith?.some(entry => entry.user === email)) {
          setIsSharedUser(true);
          const sharedEntry = data.sharedWith.find(entry => entry.user === email);
          setAccessLevel(sharedEntry?.access);
        }
        
        editor?.commands.setContent(initialContent);
        setSaveStatus("idle");
      } catch (err) {
        console.error("Error loading document:", err);
        setSaveStatus("error");
      }
    };
    
    loadContent();
    return () => saveTimeoutRef.current && clearTimeout(saveTimeoutRef.current);
  }, [documentId, editor, user]);

  // Fetch shared users when modal opens
  useEffect(() => {
    if (!showShareModal) return;
    
    const fetchSharedUsers = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (res.ok) setSharedUsers((await res.json()).sharedWith || []);
      } catch (err) {
        console.error("Failed to fetch shared users:", err);
      }
    };
    fetchSharedUsers();
  }, [showShareModal, documentId]);

  // Editor state updates
  useEffect(() => {
    if (editor && accessLevel) editor.setEditable(accessLevel !== "view");
  }, [editor, accessLevel]);

  useEffect(() => {
    if (editor && content) editor.commands.setContent(content);
  }, [editor, content]);

  useEffect(() => {
    if (editor && content) {
      setComments(extractCommentsFromDoc(editor.state.doc));
    }
  }, [editor, content]);

  // UI helpers
  const getStatusText = () => {
    switch (saveStatus) {
      case "saving": return "Saving...";
      case "saved": return "All changes saved";
      case "error": return "Error saving";
      case "loading": return "Loading...";
      default: return "";
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case "saving": return "text-yellow-500";
      case "saved": return "text-green-500";
      case "error": return "text-red-500";
      case "loading": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getCurrentContent = () => editor ? editor.getHTML() : content;

  // Toolbar buttons
  const formatButtons = [
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
  ];

  const tableButtons = [
    { cmd: "insertTable", args: { rows: 3, cols: 3, withHeaderRow: true }, label: "Insert Table" },
    { cmd: "addColumnAfter", label: "+ Col" },
    { cmd: "addRowAfter", label: "+ Row" },
    { cmd: "deleteColumn", label: "- Col" },
    { cmd: "deleteRow", label: "- Row" },
    { cmd: "mergeCells", label: "Merge" },
    { cmd: "splitCell", label: "Split" },
  ];

  if (!user) return <p className="text-center mt-10">You must be signed in.</p>;
  if (!editor) return null;

  return (
    <div className="editor-container">
      {/* SmartSearch component */}
      <div className="mb-4">
        <SmartSearch editor={editor} />
      </div>

      {/* AI Chat Popup */}
      {showChatPopup && (
        <AIChatPopup 
          documentContent={getCurrentContent()} 
          editor={editor}
        />
      )}

      {/* Collaborators and word count */}
      <div className="mt-4 flex justify-between">
        <Collaborators users={collaborators} />
        {editor && (
          <button
            onClick={handleWordCount}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            {wordCount !== null
              ? `${wordCount} word${wordCount !== 1 ? "s" : ""}`
              : "Word Count"}
          </button>
        )}
      </div>

      <div className="mb-4">
        {/* Status indicator */}
        <div className="flex justify-end mb-1">
          <div className={`text-sm ${getStatusColor()} transition-opacity duration-300`}>
            {getStatusText()}
          </div>
        </div>

        {/* Access banners */}
        {accessLevel === "view" && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-4">
            You have view-only access. Editing is disabled.
          </div>
        )}
        {accessLevel === "edit" && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
            You are a collaborator with edit access.
          </div>
        )}
        {isOwner && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded mb-4">
            You are the owner of this document.
          </div>
        )}

        {/* Document title */}
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
              className={`editor-title ${accessLevel !== "view" ? "cursor-pointer" : ""}`}
              onClick={() => accessLevel !== "view" && setIsEditingTitle(true)}
            >
              {title || "Untitled"}
            </h2>
          )}
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last edited {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {(isOwner || isSharedUser) && (
          <div className="flex gap-2 mb-4">
            {(isOwner || accessLevel === "edit") && (
              <>
                <button onClick={handleDuplicate} className="btn-secondary">
                  Duplicate
                </button>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="btn-secondary"
                >
                  Rename
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className={`btn-danger ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!isOwner}
              >
                Delete
              </button>
            )}
            {(isOwner || accessLevel === "edit") && (
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-secondary"
              >
                Share
              </button>
            )}
          </div>
        )}

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("pdf")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport("txt")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Export as TXT
          </button>
        </div>
      </div>

      {/* Editor tools and content */}
      {accessLevel !== "view" && (
        <>
          <div className="editor-toolbar">
            {formatButtons.map(({ cmd, label, args }, idx) => (
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
            
            {/* Table tools */}
            {tableButtons.map(({ cmd, label, args }, idx) => (
              <button
                key={`table-${idx}`}
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

          {/* AI Assistant */}
          <button
            id="ai-chat-button"
            onClick={() => setShowChatPopup(!showChatPopup)}
            className={`toolbar-btn ${showChatPopup ? "bg-green" : ""}`}
          >
            AI Assistant
          </button>

          {/* Comment system */}
          <button
            className="toolbar-btn"
            onClick={() => {
              const commentText = prompt("Enter your comment:");
              if (!commentText) return;
              const id = crypto.randomUUID();
              editor.chain().focus().addComment({ id, content: commentText }).run();
              setComments(prev => [...prev, { id, text: commentText }]);
            }}
          >
            Comment
          </button>

          {/* Comments sidebar */}
          <div className="fixed right-0 top-20 w-[200px] h-full bg-gray-100 border-l p-3 overflow-y-auto">
            <h4 className="font-bold mb-2">Comments</h4>
            {comments.map(c => (
              <div key={c.id} className="mb-3">
                <textarea
                  className="text-sm w-full p-1 border rounded"
                  value={c.text}
                  onChange={e => {
                    const newText = e.target.value;
                    editor.commands.updateComment(c.id, newText);
                    setComments(prev => prev.map(x => x.id === c.id ? {...x, text: newText} : x));
                  }}
                />
                <div className="flex justify-between mt-1">
                  <button
                    className="text-xs text-red-500"
                    onClick={() => {
                      editor.chain().focus().removeComment(c.id).run();
                      setComments(prev => prev.filter(x => x.id !== c.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} className="ProseMirror" />

      {/* Share modal */}
      {showShareModal && (
        <div className="modal-backdrop">
          <div className="custom-modal">
            <h3 className="modal-title">Share Document</h3>
            <p className="modal-text">
              Enter an email address to share this document:
            </p>

            <input
              type="email"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              placeholder="user@example.com"
              className="modal-input"
            />

            <select
              value={shareAccess}
              onChange={e => setShareAccess(e.target.value)}
              className="modal-input"
            >
              <option value="view">View Only</option>
              <option value="edit">Can Edit</option>
            </select>

            {shareMessage && <p className="modal-message">{shareMessage}</p>}

            {/* Shared users list */}
            {sharedUsers.length > 0 ? (
              <div className="modal-shared-list">
                <h4 className="modal-subtitle">Shared With:</h4>
                <ul className="shared-user-list">
                  {sharedUsers.map((user, index) => (
                    <li key={index} className="shared-user-item">
                      <span>{user.user}</span>
                      <span className="access-level">({user.access})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="modal-text">Not shared with anyone</p>
            )}

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={async () => {
                  const res = await fetch(`/api/documents/${documentId}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: shareEmail,
                      access: shareAccess,
                    }),
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
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}