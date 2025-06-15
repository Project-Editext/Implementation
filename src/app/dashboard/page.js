"use client";
import Header from "@/components/Header";
import Image from "next/image";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { DocumentIcon } from "@heroicons/react/24/outline";
import {
  ClipboardIcon,
  ClockIcon,
  CircleStackIcon,
  BookOpenIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import CreateDocModal from "../../components/CreateDocModal";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data);
    };
    fetchDocs();
  }, []);

  const templateIcons = {
    Notes: ClipboardIcon,
    "TODO List": ClockIcon,
    Data: CircleStackIcon,
    Journal: BookOpenIcon,
    Calendar: CalendarIcon,
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="navbar bg-secondary text-white px-4 py-3 shadow-md">
        <div className="container-fluid d-flex justify-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Image
              src="/assets/img/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />
            <h1 className="mb-0 fs-4">Editext</h1>
          </div>

          <div className="d-flex align-items-center gap-3">
            <input
              type="text"
              placeholder="Search For a File"
              className="form-control form-control-sm w-50"
            />
            <UserButton afterSignOutUrl="/#portfolio" />
            
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-10 pt-2 pb-8">
        <h2 className="text-3xl font-medium text-center mb-8 tracking-tight font-sans text-gray-800">
          Create Blank Document or Select a Template
        </h2>

        {/* Template grid */}
        <div className="grid grid-cols-6 gap-6 justify-items-center mb-12">
          {/* Create new doc */}
          <div
            onClick={() => setShowModal(true)}
            className="bg-gray-200 hover:bg-gray-300 p-6 rounded-lg text-center font-semibold cursor-pointer w-28 h-36 flex flex-col justify-center items-center"
          >
            <DocumentIcon className="h-8 w-8 text-gray-700 mb-2" />
            <p className="text-sm">Create New Document</p>
          </div>

          {/* Template items */}
          {Object.entries(templateIcons).map(([label, Icon]) => (
            <div
              key={label}
              className="bg-yellow-100 hover:bg-yellow-200 p-6 rounded-lg text-center font-semibold cursor-pointer w-28 h-36 flex flex-col justify-center items-center"
            >
              <Icon className="h-8 w-8 text-yellow-700 mb-2" />
              <p className="text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent Files */}
        <h3 className="text-lg font-bold mb-4">Recent Files</h3>
        <div className="grid grid-cols-4 gap-6">
          {docs.length > 0 ? (
            docs.map((doc) => (
              <Link
                key={doc._id}
                href={`/editor/${doc._id}`}
                className="bg-gray-200 hover:bg-gray-300 p-6 rounded-lg text-center w-40 h-40 flex flex-col justify-center items-center"
              >
                <DocumentIcon className="h-8 w-8 text-gray-600 mb-2" />
                <p className="text-sm">{doc.title || "Untitled"}</p>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 col-span-4">No documents found.</p>
          )}
        </div>
      </main>

      {/* Create Document Modal */}
      <CreateDocModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
