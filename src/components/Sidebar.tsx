'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Coins,
  Flame,
  LayoutDashboard,
  Lock,
  Menu,
  Send,
  Settings,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type NavChild = { name: string; href: string };
type NavLink = { name: string; href: string; icon: LucideIcon };
type NavSection = { name: string; icon: LucideIcon; children: NavChild[] };
type NavItem = NavLink | NavSection;

function isNavSection(item: NavItem): item is NavSection {
  return 'children' in item;
}

const isTokenCreationComingSoon = process.env.NEXT_PUBLIC_TOKEN_CREATION_COMING_SOON === 'true';
const isLiquidityLockerComingSoon = process.env.NEXT_PUBLIC_LIQUIDITY_LOCKER_COMING_SOON === 'true';
const isVestingComingSoon = process.env.NEXT_PUBLIC_VESTING_COMING_SOON === 'true';
const isMultiSendComingSoon = process.env.NEXT_PUBLIC_MULTISEND_COMING_SOON === 'true';

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dasboard', icon: LayoutDashboard },
  { name: isTokenCreationComingSoon ? 'Token Creation (Soon)' : 'Token Creation', href: '/create-token', icon: Coins },
  {
    name: 'Token Locker',
    icon: Lock,
    children: [
      { name: 'Create Lock', href: '/token-locker/token-lock' },
      { name: 'My Locks', href: '/token-locker/my-lock' },
    ],
  },
  {
    name: isLiquidityLockerComingSoon ? 'Liquidity Locker (Soon)' : 'Liquidity Locker',
    icon: Shield,
    children: [
      { name: 'Create Lock', href: '/liquidity-locker' },
      { name: 'My Locks', href: '/liquidity-locker/my-lock' },
    ],
  },
  {
    name: isVestingComingSoon ? 'Token Vesting (Soon)' : 'Token Vesting',
    icon: Calendar,
    children: [
      { name: 'Create Vesting', href: '/token-vesting/create-vesting' },
      { name: 'My Vestings', href: '/token-vesting/my-vesting' },
    ],
  },
  { name: isMultiSendComingSoon ? 'Multi-Send (Soon)' : 'Multi-Send', href: '/multi-send', icon: Send },
  { name: 'Burn', href: '/burn', icon: Flame },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navigation.forEach((item) => {
      if (isNavSection(item)) {
        const anyActive = item.children.some((child) => !child.href.startsWith('http') && pathname.startsWith(child.href));
        if (anyActive) {
          setOpenSections((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSection = (name: string) => {
    setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isRouteActive = (href: string) => pathname === href || (href === '/dasboard' && pathname === '/');

  const navClass = (active: boolean) =>
    cn(
      'group flex w-full items-center rounded-md px-3 py-3 text-sm font-medium transition-all',
      active
        ? 'border border-[#CCFF00]/40 bg-[#CCFF00]/15 text-[#CCFF00] shadow-[0_0_22px_rgba(204,255,0,0.18)]'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    );

  const iconClass = (active: boolean) =>
    cn('mr-3 h-5 w-5 flex-shrink-0', active ? 'text-[#CCFF00]' : 'text-gray-400 group-hover:text-white');

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-md border border-white/20 bg-black/90 p-2 text-white shadow-sm backdrop-blur-md lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-[9999] m-2 flex h-[calc(100vh-1rem)] w-56 flex-col rounded-lg border border-white/15 bg-[#060706]/95 shadow-[0_0_36px_rgba(204,255,0,0.08)] backdrop-blur-md transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Link href="/" className="flex items-center gap-3 px-5 py-6 text-white">
          <Image
            src="/chestfi-icon.png"
            alt="ChestFi"
            width={42}
            height={32}
            className="h-8 w-11 object-contain"
            priority
          />
          <span className="text-xl font-bold">ChestFi</span>
        </Link>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
          {navigation.map((item) => {
            if (isNavSection(item)) {
              const isSectionOpen = !!openSections[item.name];
              const isSectionActive = item.children.some((child) => !child.href.startsWith('http') && pathname.startsWith(child.href));

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    className={navClass(isSectionActive)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSection(item.name);
                    }}
                  >
                    <item.icon className={iconClass(isSectionActive)} />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isSectionOpen ? 'rotate-180' : 'rotate-0',
                        isSectionActive ? 'text-[#CCFF00]' : 'text-gray-400'
                      )}
                    />
                  </button>

                  {isSectionOpen && (
                    <div className="space-y-1 pl-9">
                      {item.children.map((child) => {
                        const isActive = isRouteActive(child.href);
                        const className = cn(
                          'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-[#CCFF00]/15 text-[#CCFF00]' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                        );

                        return child.href.startsWith('http') ? (
                          <a key={child.name} href={child.href} target="_blank" rel="noopener noreferrer" className={className}>
                            {child.name}
                          </a>
                        ) : (
                          <Link key={child.name} href={child.href} className={className}>
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = isRouteActive(item.href);
            return (
              <Link key={item.name} href={item.href} className={navClass(isActive)}>
                <item.icon className={iconClass(isActive)} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            Robinhood Chain <span className="h-2 w-2 rounded-full bg-[#CCFF00]" />
          </div>
          <p className="mt-3 text-xs text-gray-400">Network Status</p>
          <p className="mt-1 text-xs font-semibold text-[#CCFF00]">Healthy</p>
        </div>

        <div className="mx-3 mb-3 flex items-center justify-between border-t border-white/10 pt-3 text-gray-400">
          <button className="rounded-md border border-white/10 p-2 hover:border-[#CCFF00]/50 hover:text-[#CCFF00]" type="button">
            <BookOpen className="h-4 w-4" />
          </button>
          <button className="rounded-md border border-white/10 p-2 hover:border-[#CCFF00]/50 hover:text-[#CCFF00]" type="button">
            <Settings className="h-4 w-4" />
          </button>
          <Sparkles className="h-4 w-4 text-[#CCFF00]" />
        </div>

        <div className="px-3 pb-4 lg:hidden">
          <div className="border-t border-white/15 pt-4">
            <ConnectButton />
          </div>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
}
