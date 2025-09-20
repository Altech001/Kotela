
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Bot, Power, PowerOff, Trash2, DollarSign, PlusCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import type { UserBoost } from '@/lib/types';
import { storeItems as allBoosts } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const KTC_PER_HOUR = 1;

export default function MyBotsPage() {
    const { user, toggleBotStatus, deleteBot } = useAuth();
    const { toast } = useToast();
    const [botToToggle, setBotToToggle] = useState<UserBoost | null>(null);
    const [botToDelete, setBotToDelete] = useState<UserBoost | null>(null);

    const miningBots = useMemo(() => {
        if (!user || !user.boosts) return [];
        return user.boosts.filter(b => {
            const boostInfo = allBoosts.find(info => info.id === b.boostId);
            return boostInfo && boostInfo.type === 'mining_bot';
        });
    }, [user]);

    const botUpgrade = useMemo(() => {
        return user?.powerups.find(p => p.powerupId === 'bot-upgrade-1');
    }, [user]);

    const revenueRate = useMemo(() => {
        let baseRate = KTC_PER_HOUR;
        if (botUpgrade) {
            baseRate *= botUpgrade.value;
        }
        return baseRate;
    }, [botUpgrade]);

    const activeBotsCount = useMemo(() => {
        return miningBots.filter(b => b.active).length;
    }, [miningBots]);

    const dailyRevenue = activeBotsCount * revenueRate * 24;
    const totalRevenue = 0; // This would require tracking bot lifetime earnings

    const handleToggle = async () => {
        if (!botToToggle || !user || !botToToggle.instanceId) return;
        try {
            await toggleBotStatus(user.id, botToToggle.instanceId);
            toast({ title: 'Success', description: `Bot status updated.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setBotToToggle(null);
    };

    const handleDelete = async () => {
        if (!botToDelete || !user || !botToDelete.instanceId) return;
        try {
            await deleteBot(user.id, botToDelete.instanceId);
            toast({ title: 'Success', description: `Bot has been retired.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setBotToDelete(null);
    };

    if (!user) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/profile">Profile</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbPage>My Bots</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Bot /> My Auto-Mining Bots</h1>
                    <p className="text-muted-foreground mt-1">Manage your fleet of automated KTC miners.</p>
                </div>
                <Button asChild>
                    <Link href="/store"><PlusCircle className="mr-2" /> Get More Bots</Link>
                </Button>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> Revenue Overview</CardTitle>
                    <CardDescription>Estimated earnings from your currently active bots.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Bots</p>
                            <p className="text-2xl font-bold">{activeBotsCount}</p>
                        </div>
                         <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Est. Daily Revenue</p>
                            <p className="text-2xl font-bold">{dailyRevenue.toFixed(2)} KTC</p>
                        </div>
                         <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} KTC</p>
                        </div>
                    </div>
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle>Bot Fleet</CardTitle>
                    <CardDescription>Your collection of mining bots. Inactive bots do not generate revenue.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {miningBots.length > 0 ? miningBots.map((bot) => {
                            const botInfo = allBoosts.find(b => b.id === bot.boostId);
                            if (!botInfo || !bot.instanceId) return null;
                            return (
                                <div key={bot.instanceId} className="p-4 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto] items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <Bot className="h-8 w-8 text-primary" />
                                        <div>
                                            <p className="font-semibold">{botInfo.name}</p>
                                            <p className="text-xs text-muted-foreground">Instance ID: ...{bot.instanceId.slice(-6)}</p>
                                        </div>
                                    </div>
                                    
                                    <Badge variant={bot.active ? "default" : "secondary"} className="hidden md:inline-flex">
                                        {bot.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    
                                    <div className="flex items-center gap-2 justify-end">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="icon" onClick={() => setBotToToggle(bot)}>
                                                    {bot.active ? <PowerOff /> : <Power />}
                                                </Button>
                                            </AlertDialogTrigger>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" onClick={() => setBotToDelete(bot)}>
                                                    <Trash2 />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </AlertDialog>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center p-10 text-muted-foreground">
                                <p>You don't own any mining bots yet.</p>
                                <Button variant="link" asChild><Link href="/store">Visit the Store</Link></Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

             <AlertDialog open={!!botToToggle} onOpenChange={(open) => !open && setBotToToggle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {botToToggle?.active ? 'deactivate' : 'activate'} this bot?
                            {botToToggle?.active ? ' It will stop generating revenue.' : ' It will start generating revenue.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggle}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!botToDelete} onOpenChange={(open) => !open && setBotToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Confirm Retirement</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to retire this bot? This action is permanent and cannot be undone. You will need to purchase a new one from the store.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={handleDelete}>Retire Bot</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
