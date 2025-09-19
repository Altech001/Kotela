'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Copy, Send, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';


const transactionIcons = {
  deposit: ArrowUpCircle,
  withdrawal: ArrowDownCircle,
  transfer: Send,
  purchase: ShoppingCart,
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');


  if (!user) return null;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
  };
  
  const handleSendKtc = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount to send.', variant: 'destructive' });
      return;
    }
    if (!recipient) {
      toast({ title: 'Invalid Recipient', description: 'Please enter a recipient ID.', variant: 'destructive' });
      return;
    }
    if (amount > user.ktc) {
      toast({ title: 'Insufficient Funds', description: 'You do not have enough KTC to make this transfer.', variant: 'destructive' });
      return;
    }

    // Simulate transfer
    updateUser({ ktc: user.ktc - amount });
    toast({ title: 'Transfer Successful', description: `${amount} KTC sent to ${recipient}` });
    setSendAmount('');
    setRecipient('');
  };

  const sortedTransactions = user.transactions ? [...user.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.description.toLowerCase().includes('bot')) {
      return Bot;
    }
    return transactionIcons[transaction.type] || Bot;
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <Avatar className="h-24 w-24 border-2">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            {user.isKycVerified ? (
              <Badge variant="secondary">Verified</Badge>
            ) : (
              <Badge variant="destructive">Not Verified</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{user.email}</p>
          {!user.isKycVerified && (
            <p className="mt-2 text-sm">
              <Link href="/kyc" className="text-primary underline">Complete KYC</Link> to unlock all features.
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Wallet</CardTitle>
            <CardDescription>Your current KTC balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold tracking-tighter">
              {user.ktc.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-2xl text-muted-foreground">KTC</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
            <CardDescription>
              Share your code and earn rewards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Input
              readOnly
              value={user.referralCode}
              className="font-mono text-lg"
            />
            <Button size="icon" variant="outline" onClick={copyReferralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Actions</CardTitle>
          <CardDescription>
            Manage your Kotela Coin (KTC) funds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="send">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="topup">Top Up</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="send" className="pt-4">
              <form className="space-y-4" onSubmit={handleSendKtc}>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient ID</Label>
                  <Input id="recipient" placeholder="KOTELA-..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount-send">Amount</Label>
                  <Input id="amount-send" type="number" placeholder="0.00 KTC" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                </div>
                <Button className="w-full">
                  <Send className="mr-2" />
                  Send KTC
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="topup" className="pt-4 text-center">
              <p className="text-muted-foreground">Top-up feature is coming soon.</p>
            </TabsContent>
            <TabsContent value="withdraw" className="pt-4 text-center">
               <p className="text-muted-foreground">Withdrawal feature is coming soon.</p>
            </TabsContent>
             <TabsContent value="history" className="pt-4">
              <ScrollArea className="h-72">
                <div className="space-y-4">
                  {sortedTransactions.length > 0 ? (
                    sortedTransactions.map((tx, index) => {
                      const Icon = getTransactionIcon(tx);
                      const isCredit = tx.type === 'deposit';
                      return (
                        <div key={tx.id}>
                          <div className="flex items-center gap-4">
                             <Icon className={cn('h-6 w-6', isCredit ? 'text-green-500' : 'text-red-500')} />
                            <div className="flex-1">
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            <div className={cn("font-mono text-right", isCredit ? 'text-green-500' : 'text-red-500')}>
                              <p>{isCredit ? '+' : '-'} {tx.amount.toFixed(2)}</p>
                              <p className='text-xs text-muted-foreground'>KTC</p>
                            </div>
                          </div>
                           {index < sortedTransactions.length - 1 && <Separator className="my-4" />}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground text-center">No transactions yet.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
