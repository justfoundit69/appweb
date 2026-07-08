import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <div className="text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-4 text-[#1C180D]">404</h1>
        <div className="h-px w-24 bg-[#1C180D]/25 mx-auto mb-6"></div>
        <p className="text-xl md:text-2xl text-[#3f3a2b] mb-8">This page could not be found.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#CCFF00] text-[#1C180D] hover:bg-[#1C180D] hover:text-white border-2 border-[#1C180D] font-semibold rounded-md transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}













