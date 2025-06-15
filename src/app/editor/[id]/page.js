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

  if (!user) return <p className="text-center mt-10">You must be signed in.</p>;
  if (!editor) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white rounded shadow editor-container">
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            className="border px-2 py-1 text-lg font-semibold flex-1 mr-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <h2 className="text-2xl font-bold flex-1">{title || "Untitled"}</h2>
        )}

        {isOwner && (
          <div className="flex gap-2">
            {isEditingTitle ? (
              <button
                onClick={handleSaveTitle}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="bg-gray-300 text-black px-3 py-1 rounded"
              >
                Rename
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="editor-toolbar flex flex-wrap gap-2 mb-4 border-b pb-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "active" : ""}
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "active" : ""}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "active" : ""}
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "active" : ""}
        >
          P
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          Left
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          Center
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          Right
        </button>
        <button onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </button>
        <button onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} className="ProseMirror" />
    </div>
  );
}
