
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
import { DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle, DialogDescription as UIDialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/hooks/use-game';
import { Bot, Clock, Zap, Snowflake, Gem } from 'lucide-react';
import type { Boost, Powerup } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { getBoosts, getPowerups } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type StoreItem = Boost | Powerup;

const iconMap: { [key: string]: React.ElementType } = {
  mining_bot: Bot,
  score_multiplier: Zap,
  extra_time: Clock,
  time_freeze: Snowflake,
  permanent_multiplier: Gem,
};

const ItemCard = ({ item, onBuyClick, userPowerups }: { item: StoreItem, onBuyClick: (item: StoreItem) => void, userPowerups: string[] }) => {
    const Icon = iconMap[item.type];
    const isSoldOut = item.status === 'sold' || ('maxQuantity' in item && item.maxQuantity === 1 && userPowerups.includes(item.id));
    return (
        <Card className="flex flex-col relative overflow-hidden">
        {isSoldOut && <Badge variant="secondary" className="absolute top-2 right-2">Owned</Badge>}
        <CardHeader className="flex-row items-start gap-4 space-y-0">
            <div className="flex-1">
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
            </div>
            {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        </CardHeader>
        <CardContent className="flex-1"></CardContent>
        <CardFooter>
            <Button className="w-full" onClick={() => onBuyClick(item)} disabled={isSoldOut}>
            Buy for {item.cost} KTC
            </Button>
        </CardFooter>
        </Card>
    );
};

export function Store() {
  const { buyItem } = useGame();
  const { user } = useAuth();
  const { toast } = useToast();
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [powerups, setPowerups] = useState<Powerup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const [boostItems, powerupItems] = await Promise.all([getBoosts(), getPowerups()]);
      setBoosts(boostItems);
      setPowerups(powerupItems);
      setLoading(false);
    };
    fetchItems();
  }, []);
  
  const userPowerups = user?.powerups?.map(p => p.powerupId) || [];

  const handleBuyClick = (item: StoreItem) => {
    if (item.status === 'sold') {
      toast({
        title: 'Sold Out',
        description: 'This item is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }
     if ('maxQuantity' in item && item.maxQuantity === 1 && userPowerups.includes(item.id)) {
      toast({
        title: 'Already Owned',
        description: 'You can only own one of this power-up.',
      });
      return;
    }
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    const success = await buyItem(selectedItem);
    if (success) {
      toast({
        title: 'Purchase Successful!',
        description: `You've bought ${selectedItem.name}.`,
      });
    } else {
      toast({
        title: 'Purchase Failed',
        description: 'Not enough KTC or item already owned.',
        variant: 'destructive',
      });
    }

    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  return (
    <>
      <UIDialogHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <UIDialogTitle className="text-2xl font-bold tracking-tight">Store</UIDialogTitle>
              <UIDialogDescription className="text-muted-foreground text-sm">
                  Enhance your gameplay with boosts and power-ups.
              </UIDialogDescription>
            </div>
            <div className="text-left sm:text-right shrink-0">
                <p className="text-muted-foreground text-xs">Your Balance</p>
                <p className="font-bold text-lg">{user?.ktc.toFixed(2)} KTC</p>
            </div>
        </div>
      </UIDialogHeader>
      <Tabs defaultValue="boosts" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
            <TabsTrigger value="boosts">Boosts</TabsTrigger>
            <TabsTrigger value="powerups">Power-ups</TabsTrigger>
        </TabsList>
        <ScrollArea className='flex-1'>
            <div className="p-4 pt-0">
            <TabsContent value="boosts">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boosts.map((item) => (
                            <ItemCard key={item.id} item={item} onBuyClick={handleBuyClick} userPowerups={userPowerups} />
                        ))}
                    </div>
                )}
            </TabsContent>
             <TabsContent value="powerups">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                        </Card>
                    ))}
                    </div>
                ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {powerups.map((item) => (
                           <ItemCard key={item.id} item={item} onBuyClick={handleBuyClick} userPowerups={userPowerups} />
                        ))}
                    </div>
                )}
            </TabsContent>
            </div>
        </ScrollArea>
      </Tabs>
      
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
