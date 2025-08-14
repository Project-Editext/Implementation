//src/app/dashboard/page.js
"use client";
import { Suspense, useEffect, useState } from "react";
import "/public/css/globals.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import CreateFolderModal from "../../components/CreateFolderModal";
import MoveToFolderModal from "../../components/MoveToFolderModal";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import {
  ClipboardIcon,
  ClockIcon,
  CircleStackIcon,
  BookOpenIcon,
  FolderIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import CreateDocModal from "../../components/CreateDocModal";

// Sort function remains the same
const sortItems = (items, sortKey) => {
  return [...items].sort((a, b) => {
    switch (sortKey) {
      case "modified_desc":
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case "modified_asc":
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      case "created_desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "created_asc":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "title_asc":
        return (a.name || a.title || "").localeCompare(b.name || b.title || "");
      case "title_desc":
        return (b.name || b.title || "").localeCompare(a.name || a.title || "");
      default:
        return 0;
    }
  });
};

// DashboardContent component that uses searchParams
function DashboardContent() {
  const [folders, setFolders] = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [docToMove, setDocToMove] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState({
    folderId: null,
    folderName: "Dashboard",
  });
  
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "modified_desc";

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFolders(sortItems(data, currentSort));
        } else {
          console.error("API did not return an array for folders:", data);
          setFolders([]);
        }
      });
  }, [currentSort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentView.folderId) params.append("folderId", currentView.folderId);
    if (currentSort) params.append("sort", currentSort);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    fetch(`/api/documents${queryString}`)
      .then((res) => res.json())
      .then((data) => {
        if (currentView.folderId) {
          setDocs(data.filter((doc) => doc.folderId === currentView.folderId));
        } else {
          setDocs(data.filter((doc) => !doc.folderId));
        }
      });
  }, [currentView, currentSort]);

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
    if (searchQuery.trim() === "") {
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

    setFolders((current) => sortItems(current, newSortOption));
    setDocs((current) => sortItems(current, newSortOption));
  };

  const handleMoveDocument = async (doc, folderId) => {
    if (!doc) return;

    try {
      const res = await fetch(`/api/documents/${doc._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(
          `Failed to move document: ${errorData?.message || res.statusText}`
        );
        return;
      }

      const updatedDoc = await res.json();

      setDocs((currentDocs) => {
        if (currentView.folderId !== updatedDoc.folderId) {
          return currentDocs.filter((d) => d._id !== updatedDoc._id);
        }
        return currentDocs.map((d) =>
          d._id === updatedDoc._id ? updatedDoc : d
        );
      });

      setShowMoveModal(false);
      setDocToMove(null);
    } catch (error) {
      console.error("Error moving document:", error);
      alert("An error occurred while moving the document.");
    }
  };

  const handleCreateFolder = async (folderName) => {
    if (!folderName) return;

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName }),
        credentials: "include",
      });

      if (res.ok) {
        const newFolder = await res.json();
        setFolders((currentFolders) => [...currentFolders, newFolder]);
        setShowFolderModal(false);
      } else {
        const errorData = await res.json();
        alert(`Failed to create folder: ${errorData.message}`);
      }
    } catch (error) {
      alert("An error occurred while creating the folder.");
      console.error(error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!folderId) return;
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(
          `Failed to delete folder: ${errorData?.message || res.statusText}`
        );
        return;
      }

      setFolders((prev) => prev.filter((f) => f._id !== folderId));
      setDocs((prev) =>
        prev.map((d) =>
          d.folderId === folderId ? { ...d, folderId: null } : d
        )
      );
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert("An error occurred while deleting the folder.");
    }
  };

  const templateIcons = {
    Notes: ClipboardIcon,
    "TODO List": ClockIcon,
    Data: CircleStackIcon,
    Journal: BookOpenIcon,
    Calendar: CalendarIcon,
  };
  const labelToTemplateKey = {
    Notes: "notes",
    "TODO List": "to-do list",
    Data: "data",
    Journal: "journal",
    Calendar: "calendar",
  };

  const mainBg =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-black";
  const headerBg =
    theme === "dark" ? "bg-gray-800 text-white" : "bg-secondary text-white";
  const createDocBg =
    theme === "dark"
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-black";
  const templateBg =
    theme === "dark"
      ? "bg-yellow-900 hover:bg-yellow-800 text-yellow-100"
      : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700";
  const recentFileBg =
    theme === "dark"
      ? "bg-gray-800 hover:bg-gray-700 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-black";
  const recentFileIcon = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const titleColor = theme === "dark" ? "text-gray-100" : "text-gray-800";
  const noDocsColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const selectBg =
    theme === "dark"
      ? "bg-gray-700 border-gray-600"
      : "bg-gray-200 border-gray-300";
  const selectText = theme === "dark" ? "text-white" : "text-black";

  return (
    <div className={mainBg}>
      {searchQuery.trim() !== "" && (
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
                  <p className="text-sm">{doc.title || "Untitled"}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents found.</p>
          )}
        </div>
      )}

      <main className="px-10 pt-2 pb-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {currentView.folderId && (
              <button
                onClick={() =>
                  setCurrentView({ folderId: null, folderName: "Dashboard" })
                }
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Back to Dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
            )}
            <h2
              className={`text-3xl font-medium tracking-tight font-sans ${titleColor}`}
            >
              {currentView.folderName}
            </h2>
          </div>
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <FolderIcon className="h-5 w-5" />
            New Folder
          </button>
        </div>

        <div className="grid grid-cols-6 gap-6 justify-items-center mb-12">
          <div
            onClick={() => setShowModal(true)}
            className={`${createDocBg} p-6 rounded-lg text-center font-semibold cursor-pointer w-28 h-36 flex flex-col justify-center items-center`}
          >
            <DocumentIcon
              className={`h-8 w-8 mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            />
            <p className="text-sm">Create New Document</p>
          </div>

          {Object.entries(templateIcons).map(([label, Icon]) => (
            <div
              key={label}
              onClick={async () => {
                const templateKey = labelToTemplateKey[label];
                const res = await fetch("/api/documents", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
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
                  alert("Failed to create document.");
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
          <h3 className="text-lg font-bold">Documents</h3>
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
        {!currentView.folderId && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Folders</h3>
            <div className="grid grid-cols-4 gap-6">
              {folders.length > 0 ? (
                folders.map((folder) => (
                  <div
                    key={folder._id}
                    className={`${recentFileBg} p-6 rounded-lg text-center cursor-pointer w-40 h-40 flex flex-col justify-center items-center relative`}
                  >
                    <div
                      onClick={() =>
                        setCurrentView({
                          folderId: folder._id,
                          folderName: folder.name,
                        })
                      }
                      className="flex flex-col justify-center items-center w-full h-full"
                    >
                      <FolderIcon className="h-8 w-8 mb-2" />
                      <p className="text-sm">{folder.name}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder._id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500 bg-opacity-70 text-white hover:bg-opacity-90"
                      title="Delete Folder"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <p className={`${noDocsColor} col-span-4`}>No folders found.</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Files</h3>
          <div className="grid grid-cols-4 gap-6">
            {docs.length > 0 ? (
              docs.map((doc) => (
                <div key={doc._id} className="relative group">
                  <Link
                    href={`/editor/${doc._id}`}
                    className={`${recentFileBg} p-6 rounded-lg text-center w-40 h-40 flex flex-col justify-center items-center`}
                  >
                    <DocumentIcon
                      className={`h-8 w-8 mb-2 ${recentFileIcon}`}
                    />
                    <p className="text-sm">{doc.title || "Untitled"}</p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocToMove(doc);
                      setShowMoveModal(true);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-500 bg-opacity-70 text-white hover:bg-opacity-90 transition-opacity"
                    title="Move Document"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                      />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className={`${noDocsColor} col-span-4`}>No documents found.</p>
            )}
          </div>
        </div>
      </main>
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />
      <CreateDocModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        folders={folders}
        currentFolderId={currentView.folderId}
      />
      <MoveToFolderModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMoveDocument}
        folders={folders}
        doc={docToMove}
      />
    </div>
  );
}

// Main Dashboard component with Suspense
export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const headerBg =
    theme === "dark" ? "bg-gray-800 text-white" : "bg-secondary text-white";

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
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
            onSubmit={(e) => e.preventDefault()}
            role="search"
            aria-label="Search documents"
          >
            <input
              type="search"
              placeholder="Search for a document..."
              className="form-control form-control-sm w-full px-3 py-2 rounded"
              aria-label="Search for a document"
            />
          </form>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="btn btn-sm btn-outline-light"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <UserButton afterSignOutUrl="/#portfolio" />
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="p-10">Loading dashboard content...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}