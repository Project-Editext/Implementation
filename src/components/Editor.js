'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { createSearchPlugin } from '../plugins/searchPlugin';

export default function Editor() {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [query, setQuery] = useState('');
  const getQuery = () => query;

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const state = EditorState.create({
        schema,
        plugins: [createSearchPlugin(getQuery)],
      });

      viewRef.current = new EditorView(editorRef.current, { state });
    }
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch(viewRef.current.state.tr); // trigger re-render
    }
  }, [query]);

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
      />
      <div
        ref={editorRef}
        className="prose max-w-none border rounded-md p-4 bg-white dark:bg-gray-800"
      />
    </div>
  );
}
