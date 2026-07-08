'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#1C180D]/15">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 text-[#1C180D]">
            <svg
              viewBox="0 0 40 40"
              className="h-10 w-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="8" fill="#1C180D" />
              <path d="M27 13.5C25.2 11.9 23 11 20.4 11C15 11 11 14.9 11 20C11 25.1 15 29 20.4 29C23.1 29 25.5 28 27.2 26.2" stroke="#CCFF00" strokeWidth="4" strokeLinecap="round" />
              <path d="M18 20H30" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold">ChestFi</span>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}












