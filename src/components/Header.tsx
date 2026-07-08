'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/15">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/chestfi-icon.png"
              alt="ChestFi"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover bg-black"
              priority
            />
            <span className="text-xl font-bold text-white">ChestFi</span>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}












