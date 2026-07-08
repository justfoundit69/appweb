import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Coins,
  ExternalLink,
  Flame,
  Lock,
  Send,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ToolCard = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type StatCard = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
};

const tools: ToolCard[] = [
  {
    name: 'Token Creation',
    description: 'Create your own token in just a few clicks.',
    href: '/create-token',
    icon: Coins,
  },
  {
    name: 'Token Locker',
    description: 'Lock tokens and build trust with your community.',
    href: '/token-locker/token-lock',
    icon: Lock,
  },
  {
    name: 'Liquidity Locker',
    description: 'Lock liquidity and secure your projects.',
    href: '/liquidity-locker',
    icon: Shield,
  },
  {
    name: 'Token Vesting',
    description: 'Vesting schedules made simple.',
    href: '/token-vesting/create-vesting',
    icon: Calendar,
  },
  {
    name: 'Multi-Send',
    description: 'Send tokens to multiple wallets at once.',
    href: '/multi-send',
    icon: Send,
  },
  {
    name: 'Burn',
    description: 'Burn tokens forever and reduce supply.',
    href: '/burn',
    icon: Flame,
  },
];

const stats: StatCard[] = [
  { label: 'Total Locks', value: '1,248', delta: '+18.6%', icon: Lock },
  { label: 'Total Tokens Created', value: '3,542', delta: '+24.3%', icon: Coins },
  { label: 'Total Value Locked', value: '$24.68M', delta: '+31.2%', icon: Shield },
  { label: 'Active Vestings', value: '892', delta: '+12.7%', icon: Calendar },
];

const activities = [
  { label: 'Token Locked', detail: '100,000 CHFI locked', address: '0x8f...a2b1', time: '2m ago', icon: Lock },
  { label: 'Liquidity Locked', detail: '50,000 USDC / 25,000 CHFI', address: '0x3c...9d7e', time: '15m ago', icon: Calendar },
];

function Sparkline() {
  return (
    <svg viewBox="0 0 92 36" className="h-9 w-24 text-[#CCFF00]" aria-hidden="true">
      <path
        d="M2 30 L12 24 L20 28 L30 18 L40 21 L50 12 L60 17 L70 8 L82 13 L90 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M2 36 L2 30 L12 24 L20 28 L30 18 L40 21 L50 12 L60 17 L70 8 L82 13 L90 3 L90 36 Z"
        fill="currentColor"
        opacity="0.14"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <section className="relative overflow-hidden rounded-lg border border-white/12 bg-[#070807] p-3 shadow-[0_0_40px_rgba(204,255,0,0.08)]">
          <div className="relative grid min-h-[220px] gap-6 overflow-hidden rounded-lg border border-[#CCFF00]/20 bg-[linear-gradient(110deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015)_45%,rgba(204,255,0,0.08))] p-7 md:grid-cols-[1fr_420px] md:p-9">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(204,255,0,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(204,255,0,0.04)_1px,transparent_1px)] bg-[size:42px_42px] opacity-30" />
            <div className="relative flex flex-col justify-center">
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-gray-300">
                <span className="h-2 w-2 rounded-full bg-[#CCFF00]" />
                Welcome back
              </div>
              <h1 className="text-5xl font-bold leading-none tracking-normal text-white md:text-6xl">
                Chest<span className="text-[#CCFF00]">Fi</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-gray-200 md:text-lg">
                Tools for token creation, locking, vesting, and more on Robinhood Chain.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/create-token" className="btn-primary inline-flex items-center justify-center gap-3 px-7 py-3 text-base">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="https://docs.robinhood.com/chain/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center gap-3 px-7 py-3 text-base"
                >
                  <BookOpen className="h-4 w-4" />
                  View Docs
                </a>
              </div>
            </div>

            <div className="relative hidden items-center justify-center md:flex">
              <div className="relative flex h-[190px] w-[330px] items-center justify-center rounded-lg border border-[#CCFF00]/20 bg-[linear-gradient(135deg,rgba(204,255,0,0.10),rgba(0,0,0,0.55)_45%,rgba(204,255,0,0.06))] shadow-[inset_0_0_32px_rgba(204,255,0,0.12)]">
                <Image
                  src="/chestfi-icon.png"
                  alt="ChestFi chest"
                  width={300}
                  height={228}
                  priority
                  className="h-[155px] w-[210px] object-contain drop-shadow-[0_0_28px_rgba(204,255,0,0.55)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#CCFF00]/25 bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_18px_rgba(204,255,0,0.16)]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-semibold text-[#CCFF00]">{stat.delta}</span> vs last 7d
                    </p>
                  </div>
                </div>
                <Sparkline />
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group flex min-h-[150px] flex-col rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)] transition-all hover:border-[#CCFF00]/45 hover:bg-white/[0.07] hover:shadow-[0_0_24px_rgba(204,255,0,0.12)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#CCFF00]/25 bg-[#CCFF00]/12 text-[#CCFF00] shadow-[0_0_18px_rgba(204,255,0,0.14)]">
                  <tool.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{tool.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-5 text-gray-400">{tool.description}</p>
                <div className="mt-4 flex justify-end">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-[#CCFF00] transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link href="/token-locker/my-lock" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-[#CCFF00]/50 hover:text-[#CCFF00]">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.label} className="flex items-center gap-3 rounded-lg border border-white/8 bg-black/30 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CCFF00]/10 text-[#CCFF00]">
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{activity.label}</p>
                    <p className="truncate text-xs text-gray-400">{activity.detail}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{activity.address}</p>
                    <p>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(204,255,0,0.08))]" />
            <div className="relative grid gap-5 md:grid-cols-[1fr_300px]">
              <div>
                <h2 className="text-xl font-bold text-white">Ecosystem Overview</h2>
                <div className="mt-8 flex items-center gap-4">
                  {[Coins, Send, Shield].map((Icon, index) => (
                    <div
                      key={index}
                      className="flex h-16 w-16 items-center justify-center rounded-full border border-[#CCFF00]/25 bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_24px_rgba(204,255,0,0.14)]"
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#CCFF00]" />
                  <p className="font-semibold text-white">Built on Robinhood Chain</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-400">Secure. Transparent. Community driven.</p>
                <a
                  href="https://robinhoodchain.blockscout.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:border-[#CCFF00]/50 hover:text-[#CCFF00]"
                >
                  Explore Ecosystem
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
