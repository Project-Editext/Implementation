'use client';
import { io } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useUser } from '@clerk/nextjs';
import '../../../../public/css/globals.css';
import Comment from '@/components/Comment';
import Collaborators from '@/components/Collaborators';
// import Image from "@tiptap/extension-image";

export default function EditorPage() {
  const { id: documentId } = useParams();
  const { user } = useUser();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSharedUser, setIsSharedUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const saveTimeoutRef = useRef(null);

  // states for share modal and email input
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [comments, setComments] = useState([]); //comments
  //avatar
  const [collaborators, setCollaborators] = useState([]);
  const socketRef = useRef(null);
  useEffect(() => {
    if (!user || !documentId) return;

    // Make sure server is warm
    fetch('/api/socketio');

    const socket = io('/', { path: '/api/socketio' });
    socketRef.current = socket;

    socket.emit('join-document', {
      docId: documentId,
      user: {
        name: user.fullName,
        avatar: user.imageUrl,
      },
    });

    socket.on('users-updated', (users) => {
      setCollaborators(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, documentId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Start typing here...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Comment,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!documentId) return;

      // Update save status
      setSaveStatus('saving');

      // Clear any previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout to actually save
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updatedContent = editor.getHTML();
          const res = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: updatedContent }),
          });

          if (res.ok) {
            setSaveStatus('saved');
            // Clear saved status after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
          }
        } catch (err) {
          console.error('Error saving document:', err);
          setSaveStatus('error');
        }
      }, 500); // 500ms debounce
    },
    immediatelyRender: false,
  });

  const handleSaveTitle = async () => {
    setSaveStatus('saving');
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setIsEditingTitle(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving title:', err);
      setSaveStatus('error');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this document?'
    );
    if (!confirmDelete) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete document.');
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setSaveStatus('error');
    }
  };
  //handleExport
  const handleExport = async (type) => {
    const fileName = title || documentId || 'document';
    const element = document.querySelector('.ProseMirror');

    if (!element) {
      alert('No content found to export.');
      return;
    }

    if (type === 'pdf') {
      const html2pdf = (await import('html2pdf.js')).default;

      html2pdf()
        .set({
          margin: 10,
          filename: `${fileName}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();
    } else if (type === 'txt') {
      const text = element.innerText;
      const blob = new Blob([text], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    async function loadContent() {
      if (!documentId) return;
      setSaveStatus('loading');
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (res.ok) {
          const data = await res.json();
          const initialContent = data.content || '';
          setContent(initialContent);
          setTitle(data.title || 'Untitled');
          setIsOwner(data.userId === user?.id);
          const email = user?.primaryEmailAddress?.emailAddress;
          if (email && data.sharedWith?.includes(email)) {
            setIsSharedUser(true);
          }

          editor?.commands.setContent(initialContent);
          setSaveStatus('idle');
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setSaveStatus('error');
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
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'error':
        return 'Error saving';
      case 'loading':
        return 'Loading...';
      default:
        return '';
    }
  };

  // Status indicator color
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-yellow-500';
      case 'saved':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'loading':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!user) return <p className="text-center mt-10">You must be signed in.</p>;
  if (!editor) return null;

  return (
    <div className="editor-container">
      <Collaborators users={collaborators} />

      <div className="mb-4">
        {/* Status indicator above title */}
        <div className="flex justify-end mb-1">
          <div
            className={`text-sm ${getStatusColor()} transition-opacity duration-300`}
          >
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
              {title || 'Untitled'}
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
              className={`btn-danger ${
                !isOwner ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isOwner}
            >
              Delete
            </button>
          </div>
        )}
        {/* export button */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Export as TXT
          </button>
        </div>
      </div>

      <div className="editor-toolbar">
        {[
          { cmd: 'toggleBold', label: 'B' },
          { cmd: 'toggleItalic', label: 'I' },
          { cmd: 'toggleUnderline', label: 'U' },
          { cmd: 'toggleBulletList', label: '• List' },
          { cmd: 'toggleOrderedList', label: '1. List' },
          { cmd: 'setParagraph', label: 'P' },
          { cmd: 'toggleHeading', args: { level: 1 }, label: 'H1' },
          { cmd: 'toggleHeading', args: { level: 2 }, label: 'H2' },
          { cmd: 'setTextAlign', args: 'left', label: 'Left' },
          { cmd: 'setTextAlign', args: 'center', label: 'Center' },
          { cmd: 'setTextAlign', args: 'right', label: 'Right' },
          { cmd: 'undo', label: 'Undo' },
          { cmd: 'redo', label: 'Redo' },
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
      <button
        className="toolbar-btn"
        onClick={() => {
          const commentText = prompt('Enter your comment:');
          if (!commentText) return;

          const id = crypto.randomUUID(); // unique comment id

          editor.chain().focus().addComment({ id, content: commentText }).run();

          // Store the comment in state or database
          setComments((prev) => [...prev, { id, text: commentText }]);
        }}
      >
        Comment
      </button>
      <EditorContent editor={editor} className="ProseMirror" />
      <div className="fixed right-0 top-20 w-[200px] h-full bg-gray-100 border-l p-3 overflow-y-auto">
        <h4 className="font-bold mb-2">Comments</h4>
        {comments.map((c) => (
          <div key={c.id} className="mb-3">
            <p className="text-sm">{c.text}</p>
            <button
              className="text-xs text-red-500"
              onClick={() => {
                /* delete editor highlight */
                editor.chain().focus().removeComment(c.id).run();

                /* delete state  */
                setComments((prev) => prev.filter((x) => x.id !== c.id));
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {showShareModal && (
        <div className="modal-backdrop">
          <div className="custom-modal">
            <h3 className="modal-title">Share Document</h3>
            <p className="modal-text">
              Enter an email address to share this document:
            </p>

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
                  const res = await fetch(
                    `/api/documents/${documentId}/share`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: shareEmail }),
                    }
                  );

                  const data = await res.json();
                  if (res.ok) {
                    setShareMessage('Shared successfully!');
                    setShareEmail('');
                  } else {
                    setShareMessage('Error: ' + data.message);
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
