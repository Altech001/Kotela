
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/hooks/use-game';
import { Bot, Clock, Zap } from 'lucide-react';
import type { Boost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { getBoosts } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Snowflake } from 'lucide-react';

const iconMap: { [key: string]: React.ElementType } = {
  mining_bot: Bot,
  score_multiplier: Zap,
  extra_time: Clock,
  time_freeze: Snowflake,
};

export function Store() {
  const { buyBoost } = useGame();
  const { user } = useAuth();
  const { toast } = useToast();
  const [storeItems, setStoreItems] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Boost | null>(null);

  useEffect(() => {
    const fetchBoosts = async () => {
      setLoading(true);
      const items = await getBoosts();
      setStoreItems(items);
      setLoading(false);
    };
    fetchBoosts();
  }, []);

  const handleBuyClick = (item: Boost) => {
    if (item.status === 'sold') {
      toast({
        title: 'Sold Out',
        description: 'This item is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    const success = await buyBoost(selectedItem);
    if (success) {
      toast({
        title: 'Purchase Successful!',
        description: `You've bought ${selectedItem.name}.`,
      });
    } else {
      toast({
        title: 'Purchase Failed',
        description: 'Not enough KTC to purchase this item.',
        variant: 'destructive',
      });
    }

    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store</h1>
          <p className="text-muted-foreground">
            Enhance your gameplay with boosts.
          </p>
        </div>
        <div className="text-left sm:text-right">
            <p className="text-muted-foreground text-sm">Your Balance</p>
            <p className="font-bold text-xl">{user?.ktc.toFixed(2)} KTC</p>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeItems.map((item) => {
            const Icon = iconMap[item.type];
            const isSoldOut = item.status === 'sold';
            return (
              <Card key={item.id} className="flex flex-col relative overflow-hidden">
                {isSoldOut && <Badge variant="destructive" className="absolute top-2 right-2">Sold Out</Badge>}
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex-1">
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
                </CardHeader>
                <CardContent className="flex-1"></CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleBuyClick(item)} disabled={isSoldOut}>
                    Buy for {item.cost} KTC
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to buy {selectedItem?.name} for {selectedItem?.cost} KTC?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurchase}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
