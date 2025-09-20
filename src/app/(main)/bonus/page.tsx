
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBonusGames, type BonusGame } from '@/lib/actions';
import { Loader2, ArrowRight } from 'lucide-react';

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
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Bonus Games</h1>
                <p className="text-muted-foreground">
                    Play fun mini-games to earn extra KTC rewards!
                </p>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {games.map((game) => (
                        <Card key={game.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                     <div dangerouslySetInnerHTML={{ __html: game.icon }} className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle>{game.name}</CardTitle>
                                <CardDescription className="flex-grow">{game.description}</CardDescription>
                            </CardHeader>
                            <CardFooter className="mt-auto">
                                <Button asChild className="w-full">
                                    <Link href={`/bonus/${game.id}`}>
                                        Play Now <ArrowRight className="ml-2" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

