import { useEffect, useState } from 'react';
import { createSearchPlugin } from '../lib/editor/searchPlugin';

export default function SearchBar({ editor }) {
  const [query, setQuery] = useState('');

  const updateSearchPlugin = (searchQuery) => {
    if (!editor) return;

    // Remove old search plugin if exists
    const pluginsWithoutSearch = editor.state.plugins.filter(
      (p) => p.spec && p.spec.isSearchPlugin !== true
    );

    const searchPlugin = createSearchPlugin(searchQuery.trim());

    const newState = editor.state.reconfigure({
      plugins: [...pluginsWithoutSearch, searchPlugin],
    });

    editor.view.updateState(newState);
  };

  useEffect(() => {
    updateSearchPlugin(query);
  }, [query, editor]);

  const clearSearch = () => {
    setQuery('');
    updateSearchPlugin('');
  };

  return (
    <div className="flex gap-2">
      <input
        type="search"
        placeholder="Search in document..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />
      <button
        onClick={clearSearch}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        aria-label="Clear search"
      >
        Clear
      </button>
    </div>
  );
}
