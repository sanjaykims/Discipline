import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Discipline",
  description: "Your daily habit tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ⚡ Discipline
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Today</Link>
            <Link href="/habits" className="hover:text-white transition-colors">Habits</Link>
            <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
