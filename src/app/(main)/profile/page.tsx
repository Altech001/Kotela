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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
  };

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="topup">Top Up</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="send" className="pt-4">
              <form className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Recipient ID</Label>
                  <Input id="recipient" placeholder="KOTELA-..." />
                </div>
                <div>
                  <Label htmlFor="amount-send">Amount</Label>
                  <Input id="amount-send" type="number" placeholder="0.00 KTC" />
                </div>
                <Button className="w-full">Send KTC</Button>
              </form>
            </TabsContent>
            <TabsContent value="topup" className="pt-4 text-center">
              <p className="text-muted-foreground">Top-up feature is coming soon.</p>
            </TabsContent>
            <TabsContent value="withdraw" className="pt-4 text-center">
               <p className="text-muted-foreground">Withdrawal feature is coming soon.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
