"use client";

import { useEffect, useState } from "react";
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
      const updatedContent = editor.getHTML();
      fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent }),
      });
    },
  });

  const handleSaveTitle = async () => {
    await fetch(`/api/documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setIsEditingTitle(false);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmDelete) return;

    const res = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Failed to delete document.");
    }
  };

  useEffect(() => {
    async function loadContent() {
      if (!documentId) return;
      const res = await fetch(`/api/documents/${documentId}`);
      if (res.ok) {
        const data = await res.json();
        const initialContent = data.content || "";
        setContent(initialContent);
        setTitle(data.title || "Untitled");
        setIsOwner(data.userId === user?.id);
        editor?.commands.setContent(initialContent);
      }
    }
    loadContent();
  }, [documentId, editor, user]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!user) return <p className="text-center mt-10">You must be signed in.</p>;
  if (!editor) return null;

  return (
    <div className="editor-container">
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            className="editor-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <h2 className="editor-title" onClick={() => setIsEditingTitle(true)}>
            {title || "Untitled"}
          </h2>
        )}

        {isOwner && (
          <div className="flex gap-2">
            {isEditingTitle ? (
              <button onClick={handleSaveTitle} className="btn-primary">
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="btn-secondary"
              >
                Rename
              </button>
            )}
            <button onClick={handleDelete} className="btn-danger">
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
    </div>
  );
}
