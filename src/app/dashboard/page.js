'use client';
import '/public/css/globals.css';
import Image from 'next/image';
// MODIFIED: Imported 'useEffect' and 'useState'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import {
  ClipboardIcon,
  ClockIcon,
  CircleStackIcon,
  BookOpenIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import CreateDocModal from '../../components/CreateDocModal';

export default function Dashboard() {
  // ADDED: State to safely handle hydration
  const [isMounted, setIsMounted] = useState(false);
  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'modified_desc';

  // ADDED: useEffect to set the mounted state only on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetch(`/api/documents?sort=${currentSort}`)
      .then((res) => res.json())
      .then(setDocs);
  }, [currentSort]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    const res = await fetch(
      `/api/documents/search?query=${encodeURIComponent(searchQuery)}`
    );
    const data = await res.json();
    setSearchResults(data);
    setIsSearching(false);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    router.push(`${pathname}?sort=${newSortOption}`);
  };

  const templateIcons = {
    Notes: ClipboardIcon,
    'TODO List': ClockIcon,
    Data: CircleStackIcon,
    Journal: BookOpenIcon,
    Calendar: CalendarIcon,
  };
  const labelToTemplateKey = {
    Notes: 'notes',
    'TODO List': 'to-do list',
    Data: 'data',
    Journal: 'journal',
    Calendar: 'calendar',
  };

  // Theme classes
  const mainBg =
    theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black';
  const headerBg =
    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-secondary text-white';
  const createDocBg =
    theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-black';
  const templateBg =
    theme === 'dark'
      ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-100'
      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700';
  const recentFileBg =
    theme === 'dark'
      ? 'bg-gray-800 hover:bg-gray-700 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-black';
  const recentFileIcon = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const titleColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800';
  const noDocsColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const selectBg = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300';
  const selectText = theme === 'dark' ? 'text-white' : 'text-black';

  // ADDED: Conditional return to prevent hydration error
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`min-h-screen ${mainBg}`}>
      <header className={`navbar ${headerBg} px-4 py-3 shadow-md`}>
        <div className="container-fluid d-flex justify-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Link href="/" aria-label="Go to homepage">
              <Image
                className="logo me-2"
                src="/assets/img/logo.png"
                alt="Company Logo"
                width={40}
                height={40}
              />
            </Link>
            <h1 className="mb-0 fs-4">Editext</h1>
          </div>
          <form
            className="flex-grow mx-4"
            onSubmit={handleSearch}
            role="search"
            aria-label="Search documents"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a document..."
              className="form-control form-control-sm w-full px-3 py-2 rounded"
              aria-label="Search for a document"
            />
          </form>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="btn btn-sm btn-outline-light"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <UserButton afterSignOutUrl="/#portfolio" />
          </div>
        </div>
      </header>

      {searchQuery.trim() !== '' && (
        <div className="px-10 pt-2 pb-4">
          <h3 className="text-lg font-bold mb-2">Search Results</h3>
          {isSearching ? (
            <p>Searching...</p>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              {searchResults.map((doc) => (
                <Link
                  key={doc._id}
                  href={`/editor/${doc._id}`}
                  className={`bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-800 dark:text-white p-6 rounded-lg text-center w-40 h-40 flex flex-col justify-center items-center`}
                >
                  <DocumentIcon className="h-8 w-8 mb-2" />
                  <p className="text-sm">{doc.title || 'Untitled'}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents found.</p>
          )}
        </div>
      )}

      <main className="px-10 pt-2 pb-8">
        <h2
          className={`text-3xl font-medium text-center mb-8 tracking-tight font-sans ${titleColor}`}
        >
          Create Blank Document or Select a Template
        </h2>

        <div className="grid grid-cols-6 gap-6 justify-items-center mb-12">
          <div
            onClick={() => setShowModal(true)}
            className={`${createDocBg} p-6 rounded-lg text-center font-semibold cursor-pointer w-28 h-36 flex flex-col justify-center items-center`}
          >
            <DocumentIcon
              className={`h-8 w-8 mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            />
            <p className="text-sm">Create New Document</p>
          </div>

          {Object.entries(templateIcons).map(([label, Icon]) => (
            <div
              key={label}
              onClick={async () => {
                const templateKey = labelToTemplateKey[label];
                const res = await fetch('/api/documents', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    title: `New ${label} Doc`,
                    template: templateKey,
                  }),
                });

                const data = await res.json();
                if (res.ok && data._id) {
                  router.push(`/editor/${data._id}`);
                } else {
                  alert('Failed to create document.');
                }
              }}
              className={`${templateBg} p-6 rounded-lg text-center font-semibold cursor-pointer w-28 h-36 flex flex-col justify-center items-center`}
            >
              <Icon className="h-8 w-8 mb-2" />
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Recent Files</h3>
            <select
                value={currentSort}
                onChange={handleSortChange}
                className={`text-sm rounded-lg block p-2 border ${selectBg} ${selectText}`}
                aria-label="Sort documents by"
            >
                <option value="modified_desc">Date Modified (Newest)</option>
                <option value="modified_asc">Date Modified (Oldest)</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="created_desc">Date Created (Newest)</option>
                <option value="created_asc">Date Created (Oldest)</option>
            </select>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {docs.length > 0 ? (
            docs.map((doc) => (
              <Link
                key={doc._id}
                href={`/editor/${doc._id}`}
                className={`${recentFileBg} p-6 rounded-lg text-center w-40 h-40 flex flex-col justify-center items-center`}
              >
                <DocumentIcon className={`h-8 w-8 mb-2 ${recentFileIcon}`} />
                <p className="text-sm">{doc.title || 'Untitled'}</p>
              </Link>
            ))
          ) : (
            <p className={`${noDocsColor} col-span-4`}>No documents found.</p>
          )}
        </div>
      </main>

      <CreateDocModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
