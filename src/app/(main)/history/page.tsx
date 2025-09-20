'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Coins, History } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    case 'withdrawal':
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-gray-500" />;
    case 'transfer':
        return <Coins className="h-4 w-4 text-blue-500" />;
    default:
      return <Coins className="h-4 w-4" />;
  }
}

const getTransactionClass = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'text-green-500';
      case 'withdrawal':
        return 'text-red-500';
      default:
        return '';
    }
}


export default function HistoryPage() {
  const { user, loading } = useAuth();

  const transactions = (user?.transactions || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <CardTitle>Transaction History</CardTitle>
          </div>
          <CardDescription>A record of all your KTC transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 hidden md:table-cell">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (KTC)</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                        {getTransactionIcon(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                        <p className="font-medium">{tx.description}</p>
                        <p className="block sm:hidden text-xs text-muted-foreground">
                          {format(new Date(tx.timestamp), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono", getTransactionClass(tx.type))}>
                      {tx.type === 'deposit' || (tx.type === 'transfer' && tx.to === user?.id) ? '+' : '-'}
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground text-xs">
                      {format(new Date(tx.timestamp), "MMM d, yyyy, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
