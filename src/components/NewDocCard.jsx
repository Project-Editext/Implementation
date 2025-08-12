"use client";

import { useRouter } from "next/navigation";

export default function NewDocCard() {
  const router = useRouter();

  const handleClick = async () => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Document" }),
    });

    const newDoc = await res.json();
    router.push(`/editor/${newDoc._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg p-6 text-center transition-all w-40 h-40 flex flex-col justify-center items-center"
    >
      <img src="/icon/document.png" alt="Create" className="h-8 w-8 mb-2" />
      <p className="font-semibold">Create New Document</p>
    </div>
  );
}
