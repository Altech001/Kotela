'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { storeItems } from '@/lib/data';
import { useGame } from '@/hooks/use-game';
import { Bot, Clock, ShieldPlus, Zap } from 'lucide-react';
import type { Boost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const iconMap = {
  mining_bot: Bot,
  score_multiplier: Zap,
  extra_time: ShieldPlus,
  time_freeze: Clock,
};

export default function StorePage() {
  const { buyBoost } = useGame();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBuy = (item: Boost) => {
    const success = buyBoost(item);
    if (success) {
      toast({
        title: 'Purchase Successful!',
        description: `You've bought ${item.name}.`,
      });
    } else {
      toast({
        title: 'Purchase Failed',
        description: 'Not enough KTC to purchase this item.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store</h1>
          <p className="text-muted-foreground">
            Enhance your gameplay with boosts.
          </p>
        </div>
        <div className="text-right">
            <p className="text-muted-foreground text-sm">Your Balance</p>
            <p className="font-bold text-xl">{user?.ktc.toFixed(2)} KTC</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {storeItems.map((item) => {
          const Icon = iconMap[item.type];
          return (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className="flex-1">
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-1"></CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleBuy(item)}>
                  Buy for {item.cost} KTC
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
