
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBonusGames, type BonusGame } from '@/lib/actions';
import { Loader2, ArrowRight, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const GameCard = ({ game }: { game: BonusGame }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'available' | 'cooldown' | 'active'>('cooldown');
    const [label, setLabel] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const availableTime = game.availableTimestamp || 0;
            const cooldownMs = (game.cooldownMinutes || 0) * 60 * 1000;
            const durationMs = (game.durationMinutes || 0) * 60 * 1000;
            
            const gameStartTimeFromCooldownEnd = availableTime - cooldownMs;

            if (now < availableTime) {
                // Game is on cooldown
                setStatus('cooldown');
                const timeSinceCooldownStart = now - gameStartTimeFromCooldownEnd;
                const progressPercentage = Math.min(100, (timeSinceCooldownStart / cooldownMs) * 100);
                setProgress(progressPercentage);
                
                const remaining = availableTime - now;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setLabel(`Next in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

            } else {
                 if (game.durationMinutes) {
                    const endTime = availableTime + durationMs;
                    if (now < endTime) {
                        // Game is active for a limited time
                        setStatus('active');
                        const remaining = endTime - now;
                        const progressPercentage = Math.max(0, (remaining / durationMs) * 100);
                        setProgress(progressPercentage);

                        const hours = Math.floor(remaining / (1000 * 60 * 60));
                        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                        setLabel(`Ends in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

                    } else {
                        // Duration has ended, but it might be on cooldown for the next cycle.
                        // For simplicity, we'll treat it as available for now. A more complex system
                        // would calculate the next availableTimestamp.
                        setStatus('available');
                        setProgress(100);
                        setLabel('Available now');
                    }
                } else {
                    // Game is permanently available
                    setStatus('available');
                    setProgress(100);
                    setLabel('Available now');
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [game]);


    return (
        <Card key={game.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                     <div dangerouslySetInnerHTML={{ __html: game.icon }} className="w-8 h-8 text-primary" />
                     <Badge variant={status === 'available' ? 'outline' : 'secondary'}>
                        {status === 'active' ? 'Active' : status === 'cooldown' ? 'On Cooldown' : 'Available'}
                    </Badge>
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription className="flex-grow h-12">{game.description}</CardDescription>
            </CardHeader>
             <CardContent>
                {status !== 'available' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{label}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="mt-auto">
                <Button asChild className="w-full" disabled={status === 'cooldown'}>
                    <Link href={`/bonus/${game.id}`}>
                        Play Now <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function BonusGamesPage() {
    const [games, setGames] = useState<BonusGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            const bonusGames = await getBonusGames();
            setGames(bonusGames);
            setLoading(false);
        };
        fetchGames();
    }, []);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Bonus Games</h1>
                <p className="text-muted-foreground">
                    Play fun mini-games to earn extra KTC rewards! New games and rewards available daily.
                </p>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse h-72">
                            <CardHeader>
                                <div className="h-8 w-8 bg-muted rounded-full"></div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-5 w-3/4 bg-muted rounded"></div>
                                    <div className="h-4 w-full bg-muted rounded"></div>
                                    <div className="h-4 w-5/6 bg-muted rounded"></div>
                                </div>
                            </CardHeader>
                            <CardContent>
                               <div className="h-8 w-full bg-muted rounded"></div>
                            </CardContent>
                            <CardFooter>
                                <div className="h-10 w-full bg-muted rounded-md"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                       <GameCard key={game.id} game={game} />
                    ))}
                </div>
            )}
        </div>
    );
}
