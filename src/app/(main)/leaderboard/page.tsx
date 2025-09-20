
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { getLeaderboard } from '@/lib/actions';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Coins } from 'lucide-react';

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const users = await getLeaderboard();
      setLeaderboardData(users);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const obfuscateName = (name: string) => {
    if (name.length <= 4) {
      return `${name.substring(0, 1)}**`;
    }
    return `${name.substring(0, 2)}**${name.substring(name.length - 2)}`;
  };

  const obfuscateScore = (score: number) => {
    const scoreStr = score.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parts = scoreStr.split('.');
    const integerPart = parts[0].replace(/,/g, '');
    if (integerPart.length <= 3) {
        return `${'x'.repeat(integerPart.length)}.${parts[1]}`;
    }
    const visiblePart = integerPart.substring(0, integerPart.length - 3);
    return `${visiblePart.toLocaleString()}xxx.${parts[1]}`;
  };


  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            See where you rank among the top Kotela miners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Total Bot Revenue</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Active Bots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                leaderboardData.map((user, index) => (
                  <TableRow key={user.id} className={user.id === currentUser?.id ? 'bg-accent/50' : ''}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>
                            {user.id === currentUser?.id ? `${user.name} (You)` : obfuscateName(user.name)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        {user.id === currentUser?.id ? user.ktc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : obfuscateScore(user.ktc)}
                    </TableCell>
                    <TableCell className="text-right font-mono hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        {(user.totalBotRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </TableCell>
                     <TableCell className="text-right font-mono hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1">
                         <Bot className="h-3 w-3 text-primary" />
                         {user.activeBotCount || 0}
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
