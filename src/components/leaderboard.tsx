
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';

export function Leaderboard() {
  const { user } = useAuth();

  // Show only today's earnings
  const dailyScores = useMemo(() => {
    if (!user?.transactions) return [];
    const today = new Date().toISOString().slice(0, 10);
    return user.transactions
      .filter(tx => tx.type === 'deposit' && tx.description === 'Gameplay earnings' && tx.timestamp.startsWith(today))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // show top 5 daily scores
  }, [user?.transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy />
          Your Daily Mines
        </CardTitle>
        <CardDescription>Your best scores from today.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyScores.length > 0 ? (
              dailyScores.map((tx, index) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No games played today. Start mining!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
