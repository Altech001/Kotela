"use client";

import { useEffect, useState } from 'react';
import { GameEngine } from '@/components/game-engine';
import { Leaderboard } from '@/components/leaderboard';
import { Store } from '@/components/store';
import { Separator } from '@/components/ui/separator';
import { Bot, ShoppingCart, Rocket, Clock, Zap, Snowflake, Coins, MapPin, TrendingUp, BarChart, ArrowDownUp, Repeat, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { useUserLocation } from '@/hooks/use-user-location';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogWidget } from '@/components/blog-widget';
import { useGame } from '@/hooks/use-game';
import { useAuth } from '@/hooks/use-auth';
import { storeItems } from '@/lib/data';

export default function Home() {
  const { user } = useAuth();
  const { isStoreOpen, setIsStoreOpen, inventory } = useGame();
  const [isBotDialogOpen, setIsBotDialogOpen] = useState(false);
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);
  const userLocation = useUserLocation();

  const botOptions = [
    { name: "Actual grid", icon: BarChart },
    { name: "Futures Grid", icon: BarChart },
    { name: "Spot Position Grid", icon: ArrowDownUp },
    { name: "Futures Position Grid", icon: ArrowDownUp },
  ];
  
  const handleBotClick = () => {
    setIsBotDialogOpen(false);
    // Open KYC dialog only if user is not verified
    if (!user?.isKycVerified) {
      setIsKycDialogOpen(true);
    } else {
      // In a real app, you would navigate to the bot trading interface
      alert("Trading bots are available for verified users. This is a placeholder.");
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      <header className="py-4">
        <div className="container mx-auto flex w-full flex-col items-start sm:flex-row sm:items-start justify-between gap-4">
            <div className="mr-auto">
                 <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
                    Mine
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {userLocation.loading ? (
                        <Skeleton className="h-4 w-32" />
                    ) : userLocation.error ? (
                        <p className="text-xs text-destructive">{userLocation.error}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">{userLocation.displayLocation}</p>
                    )}
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mt-2">
                    Tap the coin to start mining. Use boosts to get a high score!
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-end gap-2 text-lg font-bold text-primary px-2">
                    <Coins className="w-5 h-5 text-yellow-500"/>
                    <span className='text-lg'>{user?.ktc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                 <Dialog open={isBotDialogOpen} onOpenChange={setIsBotDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Bot className="mr-2" /> Bots
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Trading Bots</DialogTitle>
                        <DialogDescription>
                          Choose a bot to automate your trading strategy.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Standard bot</h4>
                          <div className="space-y-2">
                            {botOptions.map((bot) => (
                              <button key={bot.name} onClick={handleBotClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left transition-colors">
                                <bot.icon className="h-5 w-5" />
                                <span className="font-medium">{bot.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                         <button onClick={handleBotClick} className="w-full text-left">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-muted transition-colors">
                                <Repeat className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold text-base">Automatic Spot Investment+</p>
                                </div>
                            </div>
                         </button>
                      </div>
                    </DialogContent>
                 </Dialog>
                 
                 <Dialog open={isKycDialogOpen} onOpenChange={setIsKycDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Verification Required
                            </DialogTitle>
                            <DialogDescription>
                                You must complete KYC (Know Your Customer) verification before you can use trading bots.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button asChild>
                                <Link href="/kyc">Verify Now</Link>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                 <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                        <ShoppingCart className="mr-2" /> Store
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md sm:max-w-4xl lg:max-w-6xl h-full sm:h-auto sm:max-h-[800px]">
                        <DialogHeader>
                        <DialogTitle className='flex items-center gap-2'>
                            <ShoppingCart />
                            Boost Store
                        </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-full -mx-6">
                        <div className="px-6 pb-6">
                            <Store />
                        </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </header>

      <main className="relative flex-grow flex flex-col items-center justify-center">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-16">
          <div className="relative">
            <GameEngine />
          </div>
          <Separator orientation="vertical" className="hidden lg:block h-auto self-stretch" />
          <div className="w-full max-w-md lg:max-w-4xl flex flex-col lg:flex-row gap-6">
            <div className="w-full max-w-md flex flex-col gap-6">
                <Leaderboard />
                <div className="p-4 border rounded-lg">
                    <h3 className="text-base font-semibold mb-1 flex items-center gap-2"><Rocket/> My Boosts</h3>
                    <p className="text-xs text-muted-foreground mb-3">Activate these power-ups during a game by clicking the buttons below the mining coin.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Zap className="w-4 h-4 text-yellow-500"/>
                            <span className="font-bold text-xs">Multiplier x {inventory.score_multiplier || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Clock className="w-4 h-4 text-blue-500"/>
                            <span className="font-bold text-xs">Extra Time x {inventory.extra_time || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Snowflake className="w-4 h-4 text-cyan-400"/>
                            <span className="font-bold text-xs">Freeze Time x {inventory.time_freeze || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="hidden lg:block w-full max-w-md">
                <BlogWidget limit={3} showViewAll={true} />
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full p-6 text-center text-xs text-muted-foreground">
        <p>Built with love from kotel</p>
         <Link href="/leaderboard" className="inline-flex items-center gap-1 hover:text-primary mt-1">
            <TrendingUp size={14} />
            View on the trading platform
         </Link>
      </footer>
    </div>
  );
}
