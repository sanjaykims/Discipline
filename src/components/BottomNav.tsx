"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/",         label: "Today",   icon: "✓"  },
  { href: "/habits",   label: "Habits",  icon: "☰"  },
  { href: "/workout",  label: "Workout", icon: "🏋️" },
  { href: "/stats",    label: "Stats",   icon: "◎"  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden bg-gray-950/95 backdrop-blur border-t border-gray-800 flex z-50 pb-safe">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors
              ${active ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
