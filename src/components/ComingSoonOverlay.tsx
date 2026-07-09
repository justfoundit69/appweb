'use client';

interface ComingSoonOverlayProps {
  toolName: string;
  message?: string;
}

export default function ComingSoonOverlay({ toolName, message }: ComingSoonOverlayProps) {
  return (
    <div className="fixed top-16 left-0 right-0 lg:left-64 bottom-0 z-40 pointer-events-auto cursor-not-allowed select-none">
      <div className="absolute inset-0 backdrop-blur-md bg-black/80" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-2xl z-20 text-center px-6">
        <div className="rounded-lg border border-white/20 bg-black backdrop-blur-sm p-4 shadow-sm">
          <p className="font-semibold mb-1 text-white">Coming Soon</p>
          <p className="text-sm text-gray-300">
            {message ?? `${toolName} is not available yet. Please check back later.`}
          </p>
        </div>
      </div>
    </div>
  );
}
