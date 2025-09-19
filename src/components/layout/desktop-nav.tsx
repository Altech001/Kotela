"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pickaxe, Coins, TrendingUp, User, Gift, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGame } from "@/hooks/use-game"

const navItems = [
  { href: "/game", label: "Mine", icon: Pickaxe },
  { href: "/leaderboard", label: "Leaderboard", icon: TrendingUp },
  { href: "/store", label: "Store", icon: Coins },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function DesktopNav() {
  const pathname = usePathname();
  const { gameStatus, session } = useGame();
  const score = session?.score || 0;

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isMining = gameStatus === "playing" && item.href === "/game";
        
        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            asChild
            className={cn("transition-all", isActive && "font-bold", isMining && "animate-pulse")}
          >
            <Link href={item.href}>
              <item.icon className="mr-2" /> 
              {isMining ? (
                <span>Mining: {score.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              ) : (
                item.label
              )}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
