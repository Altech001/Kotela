"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pickaxe, Coins, TrendingUp, User, Gift, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame } from "@/hooks/use-game";

const navItems = [
  { href: "/game", label: "Mine", icon: Pickaxe },
  { href: "/leaderboard", label: "Ranks", icon: TrendingUp },
  { href: "/store", label: "Store", icon: Coins },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { gameStatus, score } = useGame();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isMining = gameStatus === "playing" && item.href === "/game";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-2 hover:bg-accent transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
                 isMining ? "animate-pulse" : ""
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
               <span className="text-xs">
                {isMining ? score.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
