import Link from 'next/link';
import { ArrowRight, Coins, Lock, Shield, Calendar, Send, Flame } from 'lucide-react';

const tools = [
  {
    name: 'Token Creation',
    description: 'Create custom tokens on Robinhood Chain',
    href: '/tools/create-token',
    icon: Coins,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
  {
    name: 'Token Locker',
    description: 'Lock your tokens with custom vesting schedules',
    href: '/tools/token-locker',
    icon: Lock,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
  {
    name: 'Liquidity Locker',
    description: 'Secure your LP tokens with time-based locks',
    href: '/tools/liquidity-locker',
    icon: Shield,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
  {
    name: 'Token Vesting',
    description: 'Create and manage token vesting schedules',
    href: '/tools/vesting',
    icon: Calendar,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
  {
    name: 'Multi-Send',
    description: 'Send tokens to multiple addresses efficiently',
    href: '/tools/multi-send',
    icon: Send,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
  {
    name: 'Burn',
    description: 'Burn tokens directly from your wallet',
    href: '/tools/burn',
    icon: Flame,
    color: 'bg-[#CCFF00] text-[#1C180D]',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-4xl md:text-6xl font-bold text-[#1C180D] mb-6">
            ChestFi
          </h1>
          <p className="text-xl text-[#3f3a2b] mb-8 max-w-3xl mx-auto">
            Tools for token creation, locking, vesting, and more on Robinhood Chain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools/create-token"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="https://docs.robinhood.com/chain/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
            >
              View Docs
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-[#1C180D] mb-12">
            Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-[#1C180D] mb-2 group-hover:text-[#1C180D] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-[#3f3a2b] group-hover:text-[#1C180D] transition-colors">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center text-[#1C180D] font-medium group-hover:text-[#1C180D] group-hover:translate-x-1 transition-all">
                  Use Tool
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}













