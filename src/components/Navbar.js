"use client"; // Required for Clerk's interactive components

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="text-white p-4 flex justify-between items-center border-b">
      <Link href="/" className="text-lg font-bold">
        Editext
      </Link>

      <div className="space-x-4">
        <SignedOut>
          <SignInButton>
            <button className="bg-black px-4 py-2 rounded hover:bg-red-600">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton>
            <button className="bg-black px-4 py-2 rounded hover:bg-red-600">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}