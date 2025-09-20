
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBonusGames, type BonusGame } from '@/lib/actions';
import { Loader2, ArrowRight, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const GameCard = ({ game }: { game: BonusGame }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isAvailable, setIsAvailable] = useState(false);
    const [status, setStatus] = useState<'available' | 'cooldown' | 'active'>('cooldown');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const availableTime = game.availableTimestamp || 0;

            if (now < availableTime) {
                // Game is on cooldown
                const remaining = availableTime - now;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                setIsAvailable(false);
                setStatus('cooldown');
            } else {
                if (game.durationMinutes) {
                    // Game has a limited active duration
                    const endTime = availableTime + game.durationMinutes * 60 * 1000;
                    if (now < endTime) {
                        const remaining = endTime - now;
                        const hours = Math.floor(remaining / (1000 * 60 * 60));
                        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                        setIsAvailable(true);
                        setStatus('active');
                    } else {
                        // Duration has ended, treat as available but with no timer
                        setTimeLeft('');
                        setIsAvailable(true);
                        setStatus('available');
                    }
                } else {
                    // Game is permanently available
                    setTimeLeft('');
                    setIsAvailable(true);
                    setStatus('available');
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [game]);

    const getStatusBadge = () => {
        if (status === 'active') {
            return <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/50">Active: {timeLeft}</Badge>;
        }
        if (status === 'cooldown') {
            return <Badge variant="secondary">Next in: {timeLeft}</Badge>;
        }
        return <Badge variant="outline">Available</Badge>;
    };

    return (
        <Card key={game.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                     <div dangerouslySetInnerHTML={{ __html: game.icon }} className="w-8 h-8 text-primary" />
                     {getStatusBadge()}
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription className="flex-grow h-12">{game.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
                <Button asChild className="w-full" disabled={!isAvailable}>
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
                        <Card key={i} className="animate-pulse h-60">
                            <CardHeader>
                                <div className="h-8 w-8 bg-muted rounded-full"></div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-5 w-3/4 bg-muted rounded"></div>
                                    <div className="h-4 w-full bg-muted rounded"></div>
                                    <div className="h-4 w-5/6 bg-muted rounded"></div>
                                </div>
                            </CardHeader>
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
