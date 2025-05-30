"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditorPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      setDoc(data);
    };
    fetchDoc();
  }, [id]);

  if (!doc) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-2">{doc.title}</h1>
      <textarea
        defaultValue={doc.content}
        className="w-full h-[400px] border border-gray-300 rounded p-4"
      />
    </div>
  );
}
