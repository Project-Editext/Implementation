"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="navbar bg-secondary text-uppercase fixed-top" id="mainNav">
      <div className="container d-flex flex-nowrap">
        <div className="d-flex align-items-center">
          <Link href="/" aria-label="Go to homepage">
            <Image 
              className="logo me-2" 
              src="/assets/img/logo.png" 
              alt="Logo"
              width={60}
              height={60}
            />
          </Link>
        </div>
        <Link className="navbar-brand me-auto" href="/">Editext</Link>
        
        {/* Prevent hydration mismatch for auth buttons */}
        {mounted && (
          <div className="d-flex flex-nowrap gap-2">
            <SignedOut>
              <div className="d-flex flex-nowrap gap-2">
                <SignInButton mode="modal">
                  <button className="btn btn-primary text-white px-3 py-2">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn btn-outline-light text-white px-3 py-2">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonBox: "h-8 w-8",
                    userButtonAvatarBox: "h-8 w-8"
                  }
                }}
              />
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  );
}