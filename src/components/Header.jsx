'use client';

import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-md">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push('/dashboard')}
      >
        <img src="/icon/document.png" alt="Logo" className="w-8 h-8" />
        <span className="text-2xl font-bold">EdiText</span>
      </div>
    </header>
  );
}
