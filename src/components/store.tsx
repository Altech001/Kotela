
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
import { Bot, Clock, Zap, Snowflake, Gem, Coins, Gift, Bomb, Rocket } from 'lucide-react';
import type { Boost, Powerup, UserPowerup, UserBoost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { getBoosts, getPowerups } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useInventory } from '@/hooks/use-inventory';

type StoreItem = Boost | Powerup;

const iconMap: { [key: string]: React.ElementType } = {
  mining_bot: Bot,
  score_multiplier: Zap,
  extra_time: Clock,
  time_freeze: Snowflake,
  permanent_multiplier: Gem,
  bot_upgrade: Gem,
  scoreBomb: Gift,
  frenzy: Zap,
  missile: Bomb,
  rocket: Rocket,
};

const ItemCard = ({ item, onBuyClick, userPowerups }: { item: StoreItem, onBuyClick: (item: StoreItem) => void, userPowerups: UserPowerup[] }) => {
    const Icon = iconMap[item.type] || iconMap[item.id] || Zap;
    const isPowerup = 'maxQuantity' in item;

    let isSoldOut = false;

    if (isPowerup) {
      const ownedItem = userPowerups.find(p => p.powerupId === item.id);
      isSoldOut = !!ownedItem && (ownedItem?.quantity || 0) >= (item as Powerup).maxQuantity;
    }
    
    return (
        <Card className="flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            {isSoldOut && <Badge variant="secondary" className="absolute top-2 right-2 z-10">Owned</Badge>}
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                <div className="p-3 bg-muted rounded-full">
                    {Icon && <Icon className="w-6 h-6 text-primary"/>}
                </div>
                <div className="space-y-0.5">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <CardDescription className="text-xs">{item.description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className='flex-grow' />
            <CardFooter className="flex-grow flex items-center justify-between mt-auto pt-3 pb-3 px-4 border-t bg-muted/30">
                 <div className="font-bold text-lg flex items-center gap-1.5">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    {item.cost.toLocaleString()}
                </div>
                <Button onClick={() => onBuyClick(item)} disabled={isSoldOut}>
                    Buy
                </Button>
            </CardFooter>
        </Card>
    );
};

export function Store({ isDialog = false }: { isDialog?: boolean }) {
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
  
  const userPowerups = user?.powerups || [];

  const handleBuyClick = (item: StoreItem) => {
     if ('maxQuantity' in item) {
        const powerup = item as Powerup;
        const ownedPowerup = user?.powerups.find(p => p.powerupId === powerup.id);
        if (ownedPowerup && (ownedPowerup.quantity || 0) >= powerup.maxQuantity) {
             toast({
                title: 'Max Quantity Reached',
                description: `You already own the maximum amount of ${powerup.name}.`,
             });
             return;
        }
    }
    if (user && user.ktc < item.cost) {
      toast({
        title: 'Not enough KTC!',
        description: `You need ${item.cost.toLocaleString()} KTC to buy this item.`,
        variant: 'destructive',
      });
      return;
    }
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !user) return;

    const success = await buyItem(selectedItem);
    if (success) {
      toast({
        title: 'Purchase Successful!',
        description: `You've bought ${selectedItem.name}.`,
      });
    } else {
      toast({
        title: 'Purchase Failed',
        description: 'You may not have enough KTC or already own this item.',
        variant: 'destructive',
      });
    }

    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  const StoreContent = () => (
     <Tabs defaultValue="boosts" className="flex-1 flex flex-col h-full">
        <div className={cn("px-4", isDialog && "pt-4")}>
          <TabsList className={cn("grid w-full grid-cols-2")}>
              <TabsTrigger value="boosts">Boosts</TabsTrigger>
              <TabsTrigger value="powerups">Power-ups</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className={cn("p-4")}>
                  <TabsContent value="boosts">
                      {loading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton className="h-40" key={i} />
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
                           {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton className="h-40" key={i} />
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
        </div>
      </Tabs>
  );

  return (
    <>
      {isDialog ? (
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
          <div className='flex-1 overflow-hidden'>
            <StoreContent />
          </div>
        </>
      ) : (
        <StoreContent />
      )}
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to buy {selectedItem?.name} for {selectedItem?.cost.toLocaleString()} KTC?
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
